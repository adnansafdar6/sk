# Prompt 5 — Withdrawal System (User Side)

Create a Withdrawal page for users:

1. Show current wallet_balance
2. **Form**: withdrawal amount input, USDT wallet address (TRC20), submit button
3. **Validation**: minimum withdrawal threshold (fetch from a settings/config table or env var, default $10), can't exceed balance
4. **On submit**: create withdrawal record (status=pending), deduct amount from wallet_balance, create transaction record (type=withdrawal)
5. Below the form: **withdrawal history table** showing date, amount, wallet address, status (pending/approved/rejected) with color-coded badges
6. Add to existing navigation
