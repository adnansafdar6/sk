"""
Development settings — DEBUG on, SQLite, browsable API.
"""
from .base import *  # noqa: F401,F403

DEBUG = True

# ──────────────────────────────────────────────
# Database — SQLite for local development
# ──────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ──────────────────────────────────────────────
# DRF — add browsable API renderer in dev
# ──────────────────────────────────────────────
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
)

# ──────────────────────────────────────────────
# Email — print to console in dev (no SMTP needed)
# ──────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"