"""HTML report generator for quality evaluation results."""

import json
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional

from .config import SCORE_EXCELLENT, SCORE_PASS, REPORT_DIR


def _score_class(score: float) -> str:
    if score >= SCORE_EXCELLENT:
        return "excellent"
    elif score >= SCORE_PASS:
        return "pass"
    return "fail"


def _score_emoji(score: float) -> str:
    if score >= SCORE_EXCELLENT:
        return "&#9989;"  # checkmark
    elif score >= SCORE_PASS:
        return "&#9888;"  # warning
    return "&#10060;"  # cross


def generate_report(
    results: list[dict],
    output_dir: str = "",
    previous_dir: str = "",
) -> str:
    """Generate an HTML report from batch results.

    Args:
        results: List of result dicts from batch_runner.
        output_dir: Where to save the report. Defaults to quality_reports/YYYYMMDD_HHMMSS.
        previous_dir: Path to previous report dir for comparison.

    Returns:
        Path to the generated index.html.
    """
    if not output_dir:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = os.path.join(REPORT_DIR, timestamp)

    os.makedirs(output_dir, exist_ok=True)

    # Copy screenshots to report dir (skip if already there)
    for r in results:
        if r.get("screenshot_path") and os.path.exists(r["screenshot_path"]):
            dest = os.path.join(output_dir, f"{r['id']}.png")
            if os.path.abspath(r["screenshot_path"]) != os.path.abspath(dest):
                shutil.copy2(r["screenshot_path"], dest)
            r["screenshot_rel"] = f"{r['id']}.png"

    # Load previous results for comparison
    prev_scores = {}
    if previous_dir:
        prev_json = os.path.join(previous_dir, "results.json")
        if os.path.exists(prev_json):
            with open(prev_json) as f:
                for pr in json.load(f):
                    prev_scores[pr["id"]] = pr.get("final_score", 0)

    # Save raw results JSON
    with open(os.path.join(output_dir, "results.json"), "w") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    # Update "latest" symlink
    latest_link = os.path.join(REPORT_DIR, "latest")
    if os.path.islink(latest_link):
        os.unlink(latest_link)
    elif os.path.exists(latest_link):
        shutil.rmtree(latest_link)
    os.symlink(os.path.abspath(output_dir), latest_link)

    # Generate HTML
    html = _build_html(results, prev_scores)
    index_path = os.path.join(output_dir, "index.html")
    with open(index_path, "w") as f:
        f.write(html)

    return index_path


def _build_html(results: list[dict], prev_scores: dict) -> str:
    total = len(results)
    passed = sum(1 for r in results if r.get("final_score", 0) >= SCORE_PASS)
    excellent = sum(1 for r in results if r.get("final_score", 0) >= SCORE_EXCELLENT)
    failed = total - passed
    avg_score = sum(r.get("final_score", 0) for r in results) / max(total, 1)

    cards_html = ""
    for r in results:
        score = r.get("final_score", 0)
        rule_score = r.get("rule_score", 0)
        cls = _score_class(score)
        emoji = _score_emoji(score)

        # Comparison delta
        delta_html = ""
        if r["id"] in prev_scores:
            delta = score - prev_scores[r["id"]]
            if delta > 0:
                delta_html = f'<span class="delta positive">+{delta}</span>'
            elif delta < 0:
                delta_html = f'<span class="delta negative">{delta}</span>'
            else:
                delta_html = '<span class="delta neutral">=</span>'

        # Failed checks
        failed_checks = r.get("failed_checks", [])
        checks_html = ""
        if failed_checks:
            checks_list = "".join(f"<li>{c}</li>" for c in failed_checks)
            checks_html = f'<div class="failed-checks"><strong>Failed:</strong><ul>{checks_list}</ul></div>'

        # Issues
        issues = r.get("issues", [])
        issues_html = ""
        if issues:
            items = "".join(f"<li>{i}</li>" for i in issues[:5])
            issues_html = f'<div class="issues"><strong>Issues:</strong><ul>{items}</ul></div>'

        screenshot_html = ""
        if r.get("screenshot_rel"):
            screenshot_html = f'<img src="{r["screenshot_rel"]}" alt="{r["id"]}" loading="lazy" />'

        cards_html += f"""
        <div class="card {cls}">
            <div class="card-header">
                <span class="card-id">{r['id']}</span>
                <span class="score {cls}">{emoji} {score} {delta_html}</span>
            </div>
            <div class="card-body">
                <div class="screenshot">{screenshot_html}</div>
                <div class="details">
                    <div class="query">"{r.get('query', '')}"</div>
                    <div class="meta">
                        Type: <strong>{r.get('actual_type', '?')}</strong>
                        (expected: {r.get('expected_type', 'any')})
                        | Rule: {rule_score}
                    </div>
                    {checks_html}
                    {issues_html}
                </div>
            </div>
        </div>
        """

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Widget Quality Report</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0a0a0a; color: #e0e0e0; padding: 24px; }}
h1 {{ font-size: 24px; margin-bottom: 8px; }}
.summary {{ display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }}
.summary-card {{ background: #1a1a1a; border-radius: 12px; padding: 16px 24px; min-width: 120px; }}
.summary-card .label {{ font-size: 12px; color: #888; text-transform: uppercase; }}
.summary-card .value {{ font-size: 28px; font-weight: 700; margin-top: 4px; }}
.summary-card .value.excellent {{ color: #4ade80; }}
.summary-card .value.pass {{ color: #facc15; }}
.summary-card .value.fail {{ color: #f87171; }}
.card {{ background: #1a1a1a; border-radius: 12px; margin-bottom: 16px; overflow: hidden; border-left: 4px solid #333; }}
.card.excellent {{ border-left-color: #4ade80; }}
.card.pass {{ border-left-color: #facc15; }}
.card.fail {{ border-left-color: #f87171; }}
.card-header {{ display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #222; }}
.card-id {{ font-weight: 600; font-size: 14px; }}
.score {{ font-size: 20px; font-weight: 700; }}
.score.excellent {{ color: #4ade80; }}
.score.pass {{ color: #facc15; }}
.score.fail {{ color: #f87171; }}
.delta {{ font-size: 12px; margin-left: 6px; }}
.delta.positive {{ color: #4ade80; }}
.delta.negative {{ color: #f87171; }}
.delta.neutral {{ color: #888; }}
.card-body {{ display: flex; gap: 16px; padding: 16px; }}
.screenshot {{ flex: 0 0 120px; }}
.screenshot img {{ width: 120px; border-radius: 8px; border: 1px solid #333; }}
.details {{ flex: 1; }}
.query {{ font-style: italic; color: #aaa; margin-bottom: 8px; font-size: 13px; }}
.meta {{ font-size: 12px; color: #888; margin-bottom: 8px; }}
.failed-checks, .issues {{ font-size: 12px; margin-top: 6px; }}
.failed-checks ul, .issues ul {{ margin-left: 16px; margin-top: 4px; }}
.failed-checks li {{ color: #f87171; }}
.issues li {{ color: #facc15; }}
.filter-bar {{ margin-bottom: 16px; display: flex; gap: 8px; }}
.filter-btn {{ background: #222; border: 1px solid #333; color: #ccc; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; }}
.filter-btn.active {{ background: #333; color: #fff; border-color: #555; }}
</style>
</head>
<body>
<h1>Widget Quality Report</h1>
<p style="color:#888;margin-bottom:16px;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>

<div class="summary">
    <div class="summary-card">
        <div class="label">Total</div>
        <div class="value">{total}</div>
    </div>
    <div class="summary-card">
        <div class="label">Excellent</div>
        <div class="value excellent">{excellent}</div>
    </div>
    <div class="summary-card">
        <div class="label">Passed</div>
        <div class="value pass">{passed}</div>
    </div>
    <div class="summary-card">
        <div class="label">Failed</div>
        <div class="value fail">{failed}</div>
    </div>
    <div class="summary-card">
        <div class="label">Avg Score</div>
        <div class="value {_score_class(avg_score)}">{avg_score:.0f}</div>
    </div>
</div>

<div class="filter-bar">
    <button class="filter-btn active" onclick="filterCards('all')">All</button>
    <button class="filter-btn" onclick="filterCards('fail')">Failed</button>
    <button class="filter-btn" onclick="filterCards('pass')">Passed</button>
    <button class="filter-btn" onclick="filterCards('excellent')">Excellent</button>
</div>

<div id="cards">
{cards_html}
</div>

<script>
function filterCards(type) {{
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.card').forEach(c => {{
        if (type === 'all') {{ c.style.display = ''; return; }}
        c.style.display = c.classList.contains(type) ? '' : 'none';
    }});
}}
</script>
</body>
</html>"""
