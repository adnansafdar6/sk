# Prompt 12 — Settings & Final Polish

Create an Admin Settings page and add final touches:

1. **Admin Settings page** with editable fields: Minimum withdrawal amount, WhatsApp support number, Welcome bonus amount, Platform name, Landing page hero text, Landing page hero subtext. Store in a settings table (key-value pairs). Load these settings throughout the app wherever needed.
2. Add a **Support page** for users with FAQ accordion and WhatsApp link (from settings)
3. Add proper **loading skeletons/spinners** on all pages during data fetch
4. Add **toast notifications** for all actions (task completed, withdrawal requested, etc.)
5. Ensure all API endpoints have proper **error handling** and return consistent JSON responses
6. Add **rate limiting** on auth endpoints and task submission
7. **Test the full flow**: register → login → complete task → check balance → withdraw → admin approve
