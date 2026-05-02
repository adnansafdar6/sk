"""
Custom DRF exception handler — normalises all error responses to a consistent shape.
"""
from rest_framework.views import exception_handler
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None and isinstance(response.data, dict):
        # If the response already has a top-level "detail" key, leave it.
        if "detail" not in response.data:
            # Flatten field-level errors into a single "detail" string for
            # the frontend toast, while keeping the original errors alongside.
            messages = []
            for field, errors in response.data.items():
                if isinstance(errors, list):
                    messages.append(f"{field}: {errors[0]}")
                else:
                    messages.append(str(errors))
            response.data["detail"] = " | ".join(messages)

    return response


class AuthRateThrottle(AnonRateThrottle):
    """Strict throttle for login / register endpoints."""
    scope = "auth"


class TaskSubmitThrottle(UserRateThrottle):
    """Per-user throttle for task submissions."""
    scope = "task_submit"
