"""Quality system configuration: weights, thresholds, API endpoints."""

# ── Card dimensions ──
CARD_WIDTH = 896
CARD_HEIGHT = 1464

# ── Server endpoints ──
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"
GENERATE_ENDPOINT = f"{BACKEND_URL}/api/chat-generate"

# ── Rule check weights (must sum to 1.0) ──
RULE_WEIGHTS = {
    "text_overflow":    0.20,  # R1
    "contrast":         0.15,  # R2
    "color_match":      0.15,  # R3
    "layout_bounds":    0.15,  # R4
    "font_loaded":      0.10,  # R5
    "content_filled":   0.10,  # R6
    "style_correct":    0.10,  # R7
    "particle_health":  0.05,  # R8
}

# ── Vision model weights (must sum to 1.0) ──
VISION_WEIGHTS = {
    "intent_match":     0.25,
    "color_match":      0.20,
    "text_readability": 0.20,
    "layout_quality":   0.15,
    "aesthetic_quality": 0.10,
    "dark_mode_harmony": 0.10,
}

# ── Score thresholds ──
SCORE_EXCELLENT = 80   # ≥ 80 excellent
SCORE_PASS = 60        # 60-79 pass
# < 60 needs fix

# ── Final score formula ──
RULE_VISION_RATIO = (0.5, 0.5)  # rule_weight, vision_weight

# ── Template URL mapping (mirrors preview.js TEMPLATE_URL_MAP) ──
TEMPLATE_URL_MAP = {
    "anniversary-love":    "/widget-templates/anniversary/love/index.html",
    "anniversary-baby":    "/widget-templates/anniversary/baby/index.html",
    "anniversary-holiday": "/widget-templates/anniversary/holiday/index.html",
    "anniversary-warm":    "/widget-templates/anniversary/warm/index.html",
    "news-daily":          "/widget-templates/news/index.html",
    "news":                "/widget-templates/news/index.html",
    "alarm-clock":         "/widget-templates/alarm/index.html",
    "alarm":               "/widget-templates/alarm/index.html",
    "weather-realtime":    "/widget-templates/weather/index.html",
    "weather":             "/widget-templates/weather/index.html",
    "music-player":        "/widget-templates/music/index.html",
    "music":               "/widget-templates/music/index.html",
    "calendar-schedule":   "/widget-templates/calendar/index.html",
    "calendar":            "/widget-templates/calendar/index.html",
}

# ── Color keyword → expected hue range (degree, ±tolerance) ──
COLOR_HUE_MAP = {
    "红":   (0, 30),
    "red":  (0, 30),
    "橙":   (30, 20),
    "orange": (30, 20),
    "黄":   (55, 20),
    "yellow": (55, 20),
    "绿":   (120, 40),
    "green": (120, 40),
    "青":   (175, 25),
    "cyan": (175, 25),
    "蓝":   (220, 30),
    "blue": (220, 30),
    "紫":   (275, 30),
    "purple": (275, 30),
    "粉":   (330, 30),
    "pink": (330, 30),
}

# ── Playwright settings ──
SCREENSHOT_WAIT_MS = 3500       # wait for animations + particles to stabilize
FONT_LOAD_TIMEOUT_MS = 5000     # max wait for fonts
DEVICE_SCALE_FACTOR = 1

# ── Report output ──
REPORT_DIR = "quality_reports"
