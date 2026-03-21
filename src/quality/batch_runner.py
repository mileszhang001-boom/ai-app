"""Batch runner: iterate test queries → generate → screenshot → score → report."""

import argparse
import asyncio
import json
import os
import sys
import time
from pathlib import Path

import requests as _requests

from .config import (
    GENERATE_ENDPOINT, REPORT_DIR, SCORE_PASS,
    RULE_VISION_RATIO,
)
from .screenshot import ScreenshotEngine, get_template_path, build_widget_params
from .rule_checks import run_all_checks
from .vision_scorer import score_with_vision, compute_vision_score
from .test_queries import TEST_QUERIES
from .report import generate_report


async def call_generate_api(query: str) -> dict:
    """Call POST /api/chat-generate and return response data."""
    resp = _requests.post(
        GENERATE_ENDPOINT,
        json={"text": query},
        timeout=30,
    )
    resp.raise_for_status()
    body = resp.json()
    if not body.get("success"):
        raise ValueError(f"API error: {body.get('error', 'unknown')}")
    return body["data"]


async def run_single(
    engine: ScreenshotEngine,
    query_def: dict,
    output_dir: str,
    use_vision: bool = False,
) -> dict:
    """Run a single test case: generate → screenshot → score."""
    qid = query_def["id"]
    query = query_def["query"]
    print(f"  [{qid}] {query[:50]}...", end=" ", flush=True)

    result = {
        "id": qid,
        "query": query,
        "expected_type": query_def.get("expected_type"),
        "expected_theme": query_def.get("expected_theme"),
        "expected_color": query_def.get("expected_color", ""),
        "expected_style": query_def.get("expected_style", ""),
        "min_score": query_def.get("min_score", 60),
    }

    # Step 1: Generate
    try:
        data = await call_generate_api(query)
        result["actual_type"] = data.get("component_type", "unknown")
        result["actual_theme"] = data.get("theme", "")
        result["generate_data"] = data
    except Exception as e:
        print(f"GENERATE FAILED: {e}")
        result["error"] = f"generate: {e}"
        result["final_score"] = 0
        result["rule_score"] = 0
        result["failed_checks"] = ["generate_failed"]
        result["issues"] = [str(e)]
        return result

    # Step 2: Screenshot
    screenshot_path = os.path.join(output_dir, f"{qid}.png")
    try:
        from playwright.async_api import async_playwright

        template_path = get_template_path(
            data.get("component_type", ""),
            data.get("theme", ""),
        )
        if not template_path:
            raise ValueError(f"No template for {data.get('component_type')}/{data.get('theme')}")

        widget_params = build_widget_params(data)
        await engine.capture(data, screenshot_path)
        result["screenshot_path"] = screenshot_path
    except Exception as e:
        print(f"SCREENSHOT FAILED: {e}")
        result["error"] = f"screenshot: {e}"
        result["final_score"] = 0
        result["rule_score"] = 0
        result["failed_checks"] = ["screenshot_failed"]
        result["issues"] = [str(e)]
        return result

    # Step 3: Rule checks (need a fresh page for DOM checks)
    try:
        from .config import CARD_WIDTH, CARD_HEIGHT, FRONTEND_URL, SCREENSHOT_WAIT_MS, FONT_LOAD_TIMEOUT_MS

        widget_params = build_widget_params(data)
        style_preset = data.get("style_preset", "")
        visual_style = widget_params.get("visual_style", "")

        context = await engine._browser.new_context(
            viewport={"width": CARD_WIDTH, "height": CARD_HEIGHT},
        )
        page = await context.new_page()

        # Inject params BEFORE page scripts via add_init_script
        await page.add_init_script(
            f"window.__WIDGET_PARAMS__ = {json.dumps(widget_params)};"
        )

        full_url = f"{FRONTEND_URL}{template_path}"
        await page.goto(full_url, wait_until="domcontentloaded")

        # Set style attributes as safety belt
        if style_preset:
            await page.evaluate(f'document.documentElement.setAttribute("data-style", "{style_preset}");')
        if visual_style:
            await page.evaluate(f'document.documentElement.setAttribute("data-visual-style", "{visual_style}");')

        try:
            await page.evaluate(
                f"Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, {FONT_LOAD_TIMEOUT_MS}))])"
            )
        except Exception:
            pass
        await page.wait_for_timeout(SCREENSHOT_WAIT_MS)

        rule_result = await run_all_checks(
            page, screenshot_path,
            expected_color=result.get("expected_color", ""),
            expected_style=result.get("expected_style", ""),
        )
        await context.close()

        result["rule_score"] = rule_result["rule_score"]
        result["checks"] = rule_result["checks"]
        result["failed_checks"] = rule_result["failed_checks"]

        # Collect top issues
        all_issues = []
        for check in rule_result["checks"].values():
            if not check["passed"]:
                all_issues.append(f"[{check['name']}] {check['detail']}")
        result["issues"] = all_issues

    except Exception as e:
        print(f"RULE CHECK FAILED: {e}")
        result["rule_score"] = 0
        result["failed_checks"] = ["rule_check_error"]
        result["issues"] = [str(e)]

    # Step 4: Intent check (type matching)
    if result.get("expected_type") and result["actual_type"] != result["expected_type"]:
        result["failed_checks"] = result.get("failed_checks", []) + ["intent_mismatch"]
        result["issues"] = result.get("issues", []) + [
            f"Expected type '{result['expected_type']}' but got '{result['actual_type']}'"
        ]
        # Penalize score
        result["rule_score"] = max(0, result.get("rule_score", 0) - 25)

    if (result.get("expected_theme") and result.get("actual_theme")
            and result["actual_theme"] != result["expected_theme"]):
        result["issues"] = result.get("issues", []) + [
            f"Expected theme '{result['expected_theme']}' but got '{result['actual_theme']}'"
        ]

    # Step 5: Vision score (optional)
    vision_score = 0
    if use_vision and result.get("screenshot_path"):
        try:
            vision_result = await score_with_vision(
                result["screenshot_path"],
                query,
                data,
            )
            if vision_result:
                vision_score = compute_vision_score(vision_result)
                result["vision_score"] = vision_score
                result["vision_detail"] = vision_result
        except Exception as e:
            result["vision_error"] = str(e)

    # Step 6: Final score
    rule_w, vision_w = RULE_VISION_RATIO
    if use_vision and vision_score > 0:
        result["final_score"] = round(
            rule_w * result.get("rule_score", 0) + vision_w * vision_score
        )
    else:
        result["final_score"] = result.get("rule_score", 0)

    status = "PASS" if result["final_score"] >= result["min_score"] else "FAIL"
    print(f"{status} (score={result['final_score']})")
    return result


async def run_batch(
    queries: list[dict] = None,
    use_vision: bool = False,
    compare_dir: str = "",
) -> str:
    """Run all test queries and generate report.

    Returns path to the generated HTML report.
    """
    queries = queries or TEST_QUERIES
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    output_dir = os.path.join(REPORT_DIR, timestamp)
    os.makedirs(output_dir, exist_ok=True)

    print(f"\n=== Widget Quality Batch Run ===")
    print(f"  Queries: {len(queries)}")
    print(f"  Vision: {'ON' if use_vision else 'OFF'}")
    print(f"  Output: {output_dir}\n")

    results = []
    async with ScreenshotEngine() as engine:
        for q in queries:
            result = await run_single(engine, q, output_dir, use_vision)
            results.append(result)

    # Generate report
    report_path = generate_report(results, output_dir, compare_dir)

    # Summary
    total = len(results)
    passed = sum(1 for r in results if r.get("final_score", 0) >= r.get("min_score", 60))
    avg = sum(r.get("final_score", 0) for r in results) / max(total, 1)

    print(f"\n=== Summary ===")
    print(f"  Passed: {passed}/{total} ({100*passed//total}%)")
    print(f"  Average score: {avg:.0f}")
    print(f"  Report: {report_path}")

    # List failures
    failures = [r for r in results if r.get("final_score", 0) < r.get("min_score", 60)]
    if failures:
        print(f"\n  Failed cases ({len(failures)}):")
        for r in failures:
            print(f"    [{r['id']}] score={r.get('final_score', 0)} "
                  f"(min={r.get('min_score', 60)}) — {', '.join(r.get('failed_checks', []))}")

    return report_path


def main():
    parser = argparse.ArgumentParser(description="Widget quality batch runner")
    parser.add_argument("--vision", action="store_true", help="Enable vision model scoring")
    parser.add_argument("--compare", type=str, default="", help="Previous report dir for comparison")
    parser.add_argument("--ids", type=str, default="", help="Comma-separated query IDs to run (default: all)")
    args = parser.parse_args()

    queries = TEST_QUERIES
    if args.ids:
        ids = [i.strip() for i in args.ids.split(",")]
        queries = [q for q in TEST_QUERIES if q["id"] in ids]
        if not queries:
            print(f"No matching queries for IDs: {args.ids}")
            sys.exit(1)

    report = asyncio.run(run_batch(queries, use_vision=args.vision, compare_dir=args.compare))
    print(f"\nDone! Open report: {report}")


if __name__ == "__main__":
    main()
