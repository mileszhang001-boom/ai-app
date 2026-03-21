"""Rule-based quality checks: 8 automated checks run via Playwright + Pillow."""

import colorsys
import math
from typing import Any

from playwright.async_api import Page

from .config import CARD_WIDTH, CARD_HEIGHT, COLOR_HUE_MAP, RULE_WEIGHTS


# ── Utility ──

def _relative_luminance(r: float, g: float, b: float) -> float:
    """WCAG 2.0 relative luminance. r/g/b in 0-255."""
    def linearize(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)


def _contrast_ratio(lum1: float, lum2: float) -> float:
    lighter = max(lum1, lum2)
    darker = min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)


def _hue_distance(h1: float, h2: float) -> float:
    """Angular distance between two hue values (0-360)."""
    d = abs(h1 - h2) % 360
    return min(d, 360 - d)


def _parse_color_string(color_str: str) -> tuple:
    """Parse 'rgb(r, g, b)' or 'rgba(r, g, b, a)' to (r, g, b, a)."""
    color_str = color_str.strip()
    if color_str.startswith("rgba("):
        parts = color_str[5:-1].split(",")
        return (float(parts[0]), float(parts[1]), float(parts[2]), float(parts[3]))
    elif color_str.startswith("rgb("):
        parts = color_str[4:-1].split(",")
        return (float(parts[0]), float(parts[1]), float(parts[2]), 1.0)
    return (255, 255, 255, 1.0)


# ── Check implementations ──

async def check_text_overflow(page: Page) -> dict:
    """R1: Check if any text element overflows its container."""
    results = await page.evaluate("""() => {
        const issues = [];
        const textEls = document.querySelectorAll(
            'h1,h2,h3,h4,h5,h6,p,span,div,label,a,li,td,th,time,.hero-number,.temp-number,.date-number,.alarm-time,.subtitle-cn,.caption-cn,.song-name,.lyrics-line,.suggestion-text,.event-title,.news-title'
        );
        for (const el of textEls) {
            const text = el.textContent?.trim();
            if (!text) continue;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            if (style.overflow === 'hidden' || style.textOverflow === 'ellipsis' || style.overflowY === 'hidden') continue;
            // Skip hero numbers with line-height < 1 (intentional tight fit)
            const lh = parseFloat(style.lineHeight);
            if (lh > 0 && lh < 1 && el.classList.contains('hero-number')) continue;
            if (el.classList.contains('digit-group')) continue;
            if (el.scrollWidth > el.clientWidth + 2) {
                issues.push({
                    selector: el.className || el.tagName.toLowerCase(),
                    text: text.substring(0, 40),
                    scrollWidth: el.scrollWidth,
                    clientWidth: el.clientWidth,
                });
            }
            if (el.scrollHeight > el.clientHeight + 2 && style.whiteSpace !== 'nowrap') {
                const lineClamp = style.webkitLineClamp || style.lineClamp;
                if (!lineClamp || lineClamp === 'none') {
                    issues.push({
                        selector: el.className || el.tagName.toLowerCase(),
                        text: text.substring(0, 40),
                        scrollHeight: el.scrollHeight,
                        clientHeight: el.clientHeight,
                        type: 'vertical',
                    });
                }
            }
        }
        return issues;
    }""")
    passed = len(results) == 0
    return {
        "name": "text_overflow",
        "passed": passed,
        "score": 100 if passed else max(0, 100 - len(results) * 25),
        "issues": results,
        "detail": f"{len(results)} overflow(s) found" if results else "No overflow",
    }


async def check_contrast(page: Page) -> dict:
    """R2: Check text-to-background contrast ratio (WCAG AA ≥ 4.5:1)."""
    results = await page.evaluate("""() => {
        const issues = [];
        const checks = [];
        const textEls = document.querySelectorAll(
            '.hero-number,.temp-number,.date-number,.alarm-time,.subtitle-cn,.caption-cn,.song-name,.suggestion-text,.event-title,.news-title,h1,h2,h3,p'
        );
        for (const el of textEls) {
            const text = el.textContent?.trim();
            if (!text) continue;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            const color = style.color;
            // Walk up to find background
            let bg = 'rgba(0, 0, 0, 0)';
            let parent = el;
            while (parent) {
                const ps = window.getComputedStyle(parent);
                const bgc = ps.backgroundColor;
                if (bgc && bgc !== 'rgba(0, 0, 0, 0)' && bgc !== 'transparent') {
                    bg = bgc;
                    break;
                }
                parent = parent.parentElement;
            }
            if (bg === 'rgba(0, 0, 0, 0)') bg = 'rgb(15, 15, 20)'; // dark mode default (card bg)
            checks.push({
                selector: el.className || el.tagName.toLowerCase(),
                text: text.substring(0, 30),
                color, bg
            });
        }
        return checks;
    }""")

    issues = []
    min_ratio = 999
    for item in results:
        fg = _parse_color_string(item["color"])
        bg = _parse_color_string(item["bg"])
        # Composite fg alpha over bg
        a = fg[3] if len(fg) > 3 else 1.0
        r = fg[0] * a + bg[0] * (1 - a)
        g = fg[1] * a + bg[1] * (1 - a)
        b = fg[2] * a + bg[2] * (1 - a)
        fg_lum = _relative_luminance(r, g, b)
        bg_lum = _relative_luminance(bg[0], bg[1], bg[2])
        ratio = _contrast_ratio(fg_lum, bg_lum)
        min_ratio = min(min_ratio, ratio)
        if ratio < 4.5:
            issues.append({
                "selector": item["selector"],
                "text": item["text"],
                "ratio": round(ratio, 2),
                "required": 4.5,
            })

    passed = len(issues) == 0
    score = 100 if passed else max(0, 100 - len(issues) * 20)
    return {
        "name": "contrast",
        "passed": passed,
        "score": score,
        "issues": issues,
        "detail": f"Min ratio: {round(min_ratio, 2)}:1" if min_ratio < 999 else "No text found",
    }


async def check_color_match(page: Page, screenshot_path: str, expected_color: str = "") -> dict:
    """R3: Check if the dominant hue matches the user's requested color."""
    if not expected_color:
        return {
            "name": "color_match",
            "passed": True,
            "score": 100,
            "issues": [],
            "detail": "No color specified — skipped",
        }

    try:
        from PIL import Image
    except ImportError:
        return {
            "name": "color_match",
            "passed": True,
            "score": 100,
            "issues": [],
            "detail": "Pillow not installed — skipped",
        }

    # Find expected hue range
    expected_hue = None
    tolerance = 30
    for keyword, (hue, tol) in COLOR_HUE_MAP.items():
        if keyword in expected_color.lower():
            expected_hue = hue
            tolerance = tol
            break

    # If expected_color is a hex, compute hue directly
    if expected_hue is None and expected_color.startswith("#"):
        hex_c = expected_color.lstrip("#")
        if len(hex_c) == 6:
            r, g, b = int(hex_c[0:2], 16), int(hex_c[2:4], 16), int(hex_c[4:6], 16)
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            expected_hue = h * 360
            tolerance = 30

    if expected_hue is None:
        return {
            "name": "color_match",
            "passed": True,
            "score": 100,
            "issues": [],
            "detail": f"Unknown color keyword: {expected_color} — skipped",
        }

    # Sample the top half of the screenshot for dominant hue
    img = Image.open(screenshot_path).convert("RGB")
    w, h = img.size
    top_half = img.crop((0, 0, w, h // 2))
    pixels = list(top_half.getdata())

    # Collect hues of saturated, non-dark pixels
    hues = []
    for r, g, b in pixels:
        hh, ss, vv = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if ss > 0.15 and vv > 0.10:
            hues.append(hh * 360)

    if not hues:
        return {
            "name": "color_match",
            "passed": False,
            "score": 30,
            "issues": [{"detail": "No saturated colors found in screenshot"}],
            "detail": "No saturated colors found",
        }

    # Find median hue
    hues.sort()
    dominant_hue = hues[len(hues) // 2]
    dist = _hue_distance(dominant_hue, expected_hue)
    passed = dist <= tolerance
    score = max(0, 100 - (dist / tolerance) * 100) if tolerance > 0 else (100 if passed else 0)
    score = max(0, min(100, score))

    return {
        "name": "color_match",
        "passed": passed,
        "score": round(score),
        "issues": [] if passed else [{
            "expected_hue": expected_hue,
            "actual_hue": round(dominant_hue),
            "distance": round(dist),
        }],
        "detail": f"Hue distance: {round(dist)}° (tolerance: {tolerance}°)",
    }


async def check_layout_bounds(page: Page) -> dict:
    """R4: Check all visible elements are within card boundaries."""
    results = await page.evaluate(f"""() => {{
        const issues = [];
        const allEls = document.querySelectorAll('*');
        for (const el of allEls) {{
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            if (style.position === 'fixed' || style.position === 'absolute') {{
                // Skip canvases (particle systems use full viewport)
                if (el.tagName === 'CANVAS') continue;
            }}
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            // Allow small tolerance (2px)
            if (rect.right > {CARD_WIDTH} + 2 || rect.bottom > {CARD_HEIGHT} + 2 ||
                rect.left < -2 || rect.top < -2) {{
                // Skip body/html and full-width containers
                if (['HTML', 'BODY'].includes(el.tagName)) continue;
                // Skip elements that are intentionally off-screen (particles, ambient, glow)
                if (el.classList.contains('particle-canvas') ||
                    el.classList.contains('ambient-glow') ||
                    el.classList.contains('glass-highlight') ||
                    el.classList.contains('glow-primary') ||
                    el.classList.contains('glow-secondary') ||
                    el.classList.contains('glow-tertiary') ||
                    el.classList.contains('ambient-line') ||
                    el.classList.contains('weather-canvas')) continue;
                issues.push({{
                    selector: el.className || el.tagName.toLowerCase(),
                    rect: {{ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }},
                }});
            }}
        }}
        return issues;
    }}""")
    passed = len(results) == 0
    return {
        "name": "layout_bounds",
        "passed": passed,
        "score": 100 if passed else max(0, 100 - len(results) * 15),
        "issues": results,
        "detail": f"{len(results)} out-of-bounds element(s)" if results else "All within bounds",
    }


async def check_font_loaded(page: Page) -> dict:
    """R5: Check that custom fonts loaded successfully."""
    results = await page.evaluate("""() => {
        const status = document.fonts.status;
        const loaded = [];
        const failed = [];
        for (const font of document.fonts) {
            if (font.status === 'loaded') {
                loaded.push(font.family);
            } else if (font.status === 'error') {
                failed.push(font.family);
            }
        }
        return { status, loaded: [...new Set(loaded)], failed: [...new Set(failed)] };
    }""")
    passed = len(results.get("failed", [])) == 0
    return {
        "name": "font_loaded",
        "passed": passed,
        "score": 100 if passed else 50,
        "issues": [{"failed_fonts": results.get("failed", [])}] if not passed else [],
        "detail": f"Fonts status: {results.get('status')}, loaded: {len(results.get('loaded', []))}",
    }


async def check_content_filled(page: Page) -> dict:
    """R6: Check that template content has been properly filled (no '--' placeholders)."""
    results = await page.evaluate("""() => {
        const issues = [];
        const textEls = document.querySelectorAll(
            '.hero-number,.temp-number,.date-number,.alarm-time,.subtitle-cn,.caption-cn,.song-name,.suggestion-text,.event-title,.news-title,h1,h2,h3,p,span'
        );
        for (const el of textEls) {
            const text = el.textContent?.trim();
            if (!text) continue;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            if (text === '--' || text === '---' || text === '{{' || text.includes('undefined') || text.includes('null')) {
                issues.push({
                    selector: el.className || el.tagName.toLowerCase(),
                    text: text.substring(0, 40),
                });
            }
        }
        return issues;
    }""")
    passed = len(results) == 0
    return {
        "name": "content_filled",
        "passed": passed,
        "score": 100 if passed else max(0, 100 - len(results) * 30),
        "issues": results,
        "detail": f"{len(results)} unfilled element(s)" if results else "All content filled",
    }


async def check_style_correct(page: Page, expected_style: str = "") -> dict:
    """R7: Check that visual style attribute is set and CSS takes effect."""
    if not expected_style:
        return {
            "name": "style_correct",
            "passed": True,
            "score": 100,
            "issues": [],
            "detail": "No style specified — skipped",
        }

    results = await page.evaluate(f"""() => {{
        const style = document.documentElement.getAttribute('data-visual-style');
        const issues = [];
        if (style !== '{expected_style}') {{
            issues.push({{ expected: '{expected_style}', actual: style }});
        }}

        // Check style-specific effects
        if ('{expected_style}' === 'minimal' || '{expected_style}' === 'pixel') {{
            const canvas = document.querySelector('.particle-canvas');
            if (canvas) {{
                const cs = window.getComputedStyle(canvas);
                if (cs.display !== 'none') {{
                    issues.push({{ detail: 'Particle canvas should be hidden for ' + '{expected_style}' }});
                }}
            }}
        }}
        return issues;
    }}""")
    passed = len(results) == 0
    return {
        "name": "style_correct",
        "passed": passed,
        "score": 100 if passed else 30,
        "issues": results,
        "detail": f"Style '{expected_style}' " + ("applied correctly" if passed else "not applied"),
    }


async def check_particle_health(page: Page) -> dict:
    """R8: Check that particle canvas has non-zero pixels (animation running)."""
    results = await page.evaluate("""() => {
        const canvas = document.querySelector('.particle-canvas, .weather-canvas, canvas');
        if (!canvas) return { found: false, hasPixels: false };
        const style = window.getComputedStyle(canvas);
        if (style.display === 'none') return { found: true, hidden: true, hasPixels: true };
        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) return { found: true, hasPixels: false, reason: 'no 2d context' };
            const w = Math.min(canvas.width, 200);
            const h = Math.min(canvas.height, 200);
            const data = ctx.getImageData(0, 0, w, h).data;
            let nonZero = 0;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] > 0) nonZero++;
            }
            return { found: true, hasPixels: nonZero > 10, nonZeroCount: nonZero };
        } catch(e) {
            return { found: true, hasPixels: false, reason: e.message };
        }
    }""")
    if not results.get("found"):
        return {
            "name": "particle_health",
            "passed": True,
            "score": 100,
            "issues": [],
            "detail": "No canvas found (template may not use particles)",
        }
    if results.get("hidden"):
        return {
            "name": "particle_health",
            "passed": True,
            "score": 100,
            "issues": [],
            "detail": "Canvas hidden by visual style — OK",
        }
    passed = results.get("hasPixels", False)
    return {
        "name": "particle_health",
        "passed": passed,
        "score": 100 if passed else 30,
        "issues": [] if passed else [{"detail": results.get("reason", "No pixels rendered")}],
        "detail": f"Non-zero pixels: {results.get('nonZeroCount', 0)}",
    }


# ── Aggregate ──

async def run_all_checks(
    page: Page,
    screenshot_path: str,
    expected_color: str = "",
    expected_style: str = "",
) -> dict:
    """Run all 8 rule checks and return weighted score."""
    checks = [
        await check_text_overflow(page),
        await check_contrast(page),
        await check_color_match(page, screenshot_path, expected_color),
        await check_layout_bounds(page),
        await check_font_loaded(page),
        await check_content_filled(page),
        await check_style_correct(page, expected_style),
        await check_particle_health(page),
    ]

    weighted_score = 0
    for check in checks:
        weight = RULE_WEIGHTS.get(check["name"], 0)
        weighted_score += check["score"] * weight

    return {
        "rule_score": round(weighted_score),
        "checks": {c["name"]: c for c in checks},
        "all_passed": all(c["passed"] for c in checks),
        "failed_checks": [c["name"] for c in checks if not c["passed"]],
    }
