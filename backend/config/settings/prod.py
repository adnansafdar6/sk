"""
Production settings — security hardened, PostgreSQL, env-driven.
"""
from .base import *  # noqa: F401,F403
import dj_database_url
from decouple import config

DEBUG = False

# ──────────────────────────────────────────────
# Database — prefers DATABASE_URL (Railway auto-sets this)
# Falls back to individual DB_* vars for non-Railway hosting
# ──────────────────────────────────────────────
DATABASES = {
    "default": dj_database_url.config(
        default=(
            f"postgresql://{config('DB_USER', default='postgres')}"
            f":{config('DB_PASSWORD', default='')}"
            f"@{config('DB_HOST', default='localhost')}"
            f":{config('DB_PORT', default='5432')}"
            f"/{config('DB_NAME', default='sk_db')}"
        ),
        conn_max_age=600,
        ssl_require=config("DB_SSL_REQUIRE", default=True, cast=bool),
    )
}

# ──────────────────────────────────────────────
# Security headers
# ──────────────────────────────────────────────
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ──────────────────────────────────────────────
# Static files — WhiteNoise
# Inserted at index 2 (after SecurityMiddleware + CorsMiddleware)
# ──────────────────────────────────────────────
MIDDLEWARE.insert(2, "whitenoise.middleware.WhiteNoiseMiddleware")  # noqa: F405

STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# ──────────────────────────────────────────────
# Email — SMTP in production
# ──────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"