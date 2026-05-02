"""
Email sending utilities for authentication flows.
Uses Django's built-in email system — console backend in dev, SMTP in prod.
"""
from django.conf import settings
from django.core.mail import send_mail

from .tokens import generate_email_verification_token, generate_password_reset_token


FRONTEND_URL = getattr(settings, "FRONTEND_URL", "http://localhost:5173")


def send_verification_email(user):
    """Send email verification link to user."""
    token = generate_email_verification_token(user)
    verification_url = f"{FRONTEND_URL}/verify-email?token={token}"

    subject = "Verify your email address"
    message = (
        f"Hi {user.first_name},\n\n"
        f"Please verify your email address by clicking the link below:\n\n"
        f"{verification_url}\n\n"
        f"This link will expire in 24 hours.\n\n"
        f"If you didn't create an account, you can safely ignore this email.\n\n"
        f"Best regards,\nThe SK Team"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def send_password_reset_email(user):
    """Send password reset link to user."""
    token = generate_password_reset_token(user)
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"

    subject = "Reset your password"
    message = (
        f"Hi {user.first_name},\n\n"
        f"You requested a password reset. Click the link below to set a new password:\n\n"
        f"{reset_url}\n\n"
        f"This link will expire in 1 hour.\n\n"
        f"If you didn't request this, you can safely ignore this email.\n\n"
        f"Best regards,\nThe SK Team"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
