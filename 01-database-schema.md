# Prompt 1 — Database Schema & Models

Look at my existing project structure and database setup. Based on the following requirements, create or modify the database schema/models:

1. **Users table**: id, username, phone, password_hash, role (admin/user), vip_level (0=regular, 1,2,3=VIP tiers), wallet_balance (decimal), referral_code, status (active/banned/suspended), created_at, updated_at
2. **Tasks table**: id, title, description, instructions, reward_amount (decimal), daily_limit, status (active/inactive), vip_level_required (0=all), created_at
3. **Task_completions table**: id, user_id, task_id, status (completed/pending/rejected), earned_amount, completed_at
4. **Withdrawals table**: id, user_id, amount, wallet_address, status (pending/approved/rejected), reviewed_by, reviewed_at, created_at
5. **Transactions table**: id, user_id, type (earning/withdrawal), amount, description, created_at
6. **VIP_plans table**: id, name, level, price, benefits_json, daily_task_limit, created_at

Add proper foreign keys, indexes, and seed an admin account (admin/admin123). Migrate the database. Don't break any existing auth or routing — extend what's already there.
