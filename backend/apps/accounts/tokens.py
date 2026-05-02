"""
Token utilities for email verification and password reset.
Uses Django's built-in signing framework — tokens are HMAC-signed,
time-limited, and require no database table.
"""
from django.conf import settings
from django.core import signing

# Token expiry durations (seconds)
EMAIL_VERIFY_TOKEN_MAX_AGE = 60 * 60 * 24  # 24 hours
PASSWORD_RESET_TOKEN_MAX_AGE = 60 * 60  # 1 hour


def generate_email_verification_token(user):
    """Generate a signed token for email verification."""
    return signing.dumps(
        {"user_id": str(user.pk), "purpose": "email-verify"},
        salt="email-verification",
    )


def verify_email_token(token):
    """Verify and decode an email verification token. Returns user_id or None."""
    try:
        data = signing.loads(
            token,
            salt="email-verification",
            max_age=EMAIL_VERIFY_TOKEN_MAX_AGE,
        )
        if data.get("purpose") != "email-verify":
            return None
        return data.get("user_id")
    except (signing.BadSignature, signing.SignatureExpired):
        return None


def generate_password_reset_token(user):
    """Generate a signed token for password reset."""
    return signing.dumps(
        {"user_id": str(user.pk), "purpose": "password-reset"},
        salt="password-reset",
    )


def verify_password_reset_token(token):
    """Verify and decode a password reset token. Returns user_id or None."""
    try:
        data = signing.loads(
            token,
            salt="password-reset",
            max_age=PASSWORD_RESET_TOKEN_MAX_AGE,
        )
        if data.get("purpose") != "password-reset":
            return None
        return data.get("user_id")
    except (signing.BadSignature, signing.SignatureExpired):
        return None
