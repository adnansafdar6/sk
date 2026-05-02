# Prompt 2 — Auth & User Registration

Look at my existing auth system. Modify or extend it to support:

1. **Registration**: username + phone + password, auto-generate a unique referral code, default role=user, vip_level=0, wallet_balance=0
2. **Login**: username or phone + password, return JWT or session with user role
3. **Role-based middleware**: protect admin routes (role=admin only) and user routes (role=user). Redirect unauthorized access.
4. On successful registration, create a welcome transaction record: "Welcome bonus" with amount 0 (or configurable amount from settings)

Keep the existing login/register UI but add the phone field if missing. Show validation errors inline.
