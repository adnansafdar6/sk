# Prompt 4 — Task Center (User Side)

Create a Task Center page for users:

1. Show all active tasks the user is eligible for (based on their vip_level)
2. Each task card shows: title, description snippet, reward amount in USDT, a "Start Task" button
3. Clicking "Start Task" opens a modal/page showing full instructions
4. User clicks "Submit Task" after completing it
5. **Backend**: validate the user hasn't exceeded daily_limit for that task, mark task as completed, add reward to wallet_balance, create a transaction record
6. Show success animation/toast with "You earned $X USDT!"
7. Update dashboard stats without full page reload

Add this to the existing sidebar/navigation. Follow existing routing patterns in the codebase.
