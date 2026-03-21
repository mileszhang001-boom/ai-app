"""Playwright-based screenshot engine for widget templates."""

import asyncio
import json
import os
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright, Page, Browser

from .config import (
    CARD_WIDTH, CARD_HEIGHT, FRONTEND_URL, TEMPLATE_URL_MAP,
    SCREENSHOT_WAIT_MS, FONT_LOAD_TIMEOUT_MS, DEVICE_SCALE_FACTOR,
)


def get_template_path(component_type: str, theme: str = "") -> Optional[str]:
    """Resolve template URL path from component_type and theme."""
    key = f"{component_type}-{theme}" if theme else component_type
    return TEMPLATE_URL_MAP.get(key) or TEMPLATE_URL_MAP.get(component_type)


def build_widget_params(data: dict) -> dict:
    """Build widget params dict — mirrors preview.js buildWidgetParams()."""
    if not data or "params" not in data:
        return {}
    p = {**data["params"]}

    if data.get("style_preset"):
        p["style_preset"] = data["style_preset"]
    if data.get("primary_color"):
        p["primary_color"] = data["primary_color"]
    if data.get("visual_style"):
        p["visual_style"] = data["visual_style"]

    # Anniversary date normalization
    if data.get("component_type") == "anniversary":
        if p.get("date") and not p.get("start_date") and not p.get("target_date"):
            if data.get("theme") == "holiday":
                p["target_date"] = p["date"]
            else:
                p["start_date"] = p["date"]
        if p.get("message") and not p.get("subtitle"):
            p["subtitle"] = p["message"]

    # Alarm time normalization
    if data.get("component_type") == "alarm":
        if p.get("time") and not p.get("alarm_time"):
            p["alarm_time"] = p["time"]

    return p


async def inject_params_and_screenshot(
    page: Page,
    template_url: str,
    widget_params: dict,
    style_preset: str = "",
    output_path: str = "screenshot.png",
) -> str:
    """Load a template page, inject params, and take a screenshot."""
    full_url = f"{FRONTEND_URL}{template_url}"

    # Inject params BEFORE any page scripts via add_init_script
    # This ensures window.__WIDGET_PARAMS__ is available when main.js reads it
    await page.add_init_script(
        f"window.__WIDGET_PARAMS__ = {json.dumps(widget_params)};"
    )

    await page.goto(full_url, wait_until="domcontentloaded")

    # Set data-style / data-visual-style as safety belt (templates also set these in init)
    if style_preset:
        await page.evaluate(
            f'document.documentElement.setAttribute("data-style", "{style_preset}");'
        )
    visual_style = widget_params.get("visual_style", "")
    if visual_style:
        await page.evaluate(
            f'document.documentElement.setAttribute("data-visual-style", "{visual_style}");'
        )

    # Wait for fonts
    try:
        await page.evaluate(
            f"Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, {FONT_LOAD_TIMEOUT_MS}))])"
        )
    except Exception:
        pass

    # Wait for animations to stabilize
    await page.wait_for_timeout(SCREENSHOT_WAIT_MS)

    # Take screenshot
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    await page.screenshot(path=output_path, full_page=False)
    return output_path


async def capture_widget(
    data: dict,
    output_path: str = "screenshot.png",
    browser: Browser = None,
) -> str:
    """High-level: given API response data, capture a screenshot.

    Args:
        data: The 'data' field from /api/chat-generate response.
        output_path: Where to save the PNG.
        browser: Reuse an existing browser instance. If None, creates one.

    Returns:
        Path to the saved screenshot.
    """
    template_path = get_template_path(
        data.get("component_type", ""),
        data.get("theme", ""),
    )
    if not template_path:
        raise ValueError(
            f"Unknown template: {data.get('component_type')}/{data.get('theme')}"
        )

    widget_params = build_widget_params(data)
    style_preset = data.get("style_preset", "")

    own_browser = browser is None
    pw = None
    if own_browser:
        pw = await async_playwright().start()
        browser = await pw.chromium.launch(headless=True)

    try:
        context = await browser.new_context(
            viewport={"width": CARD_WIDTH, "height": CARD_HEIGHT},
            device_scale_factor=DEVICE_SCALE_FACTOR,
        )
        page = await context.new_page()
        result = await inject_params_and_screenshot(
            page, template_path, widget_params, style_preset, output_path
        )
        await context.close()
        return result
    finally:
        if own_browser:
            await browser.close()
            if pw:
                await pw.stop()


class ScreenshotEngine:
    """Manages a persistent browser for batch screenshot operations."""

    def __init__(self):
        self._pw = None
        self._browser = None

    async def start(self):
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(headless=True)

    async def stop(self):
        if self._browser:
            await self._browser.close()
        if self._pw:
            await self._pw.stop()

    async def capture(self, data: dict, output_path: str) -> str:
        if not self._browser:
            await self.start()
        return await capture_widget(data, output_path, self._browser)

    async def __aenter__(self):
        await self.start()
        return self

    async def __aexit__(self, *args):
        await self.stop()
