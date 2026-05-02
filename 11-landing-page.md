# Prompt 11 — Landing Page Features

Modify my existing landing page to add:

1. **Live payouts ticker**: a scrolling horizontal banner showing recent approved withdrawals (username partially masked, amount, time ago). Fetch last 20 approved withdrawals from API. Auto-scroll animation with CSS.
2. **Payment proof table**: below the hero section, show a table of recent payouts (masked username, amount, date, status=Paid) — last 10 records
3. **Testimonials section**: hardcode 4-5 success story cards (avatar placeholder, name, quote, earnings). Make this editable from admin settings later.
4. **Stats counters**: "Total Users", "Total Paid Out", "Tasks Available" — animated count-up on scroll into view. Fetch real numbers from a public API endpoint.
5. **WhatsApp floating button**: fixed bottom-right, links to WhatsApp number from config/env

Keep the existing hero section and login form. Add these sections below.
