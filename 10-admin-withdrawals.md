# Prompt 10 — Admin Withdrawal Approval

Create an Admin Withdrawal Management page:

1. Table: user, amount, wallet address, request date, status, action buttons
2. **Filter tabs**: All, Pending, Approved, Rejected
3. For pending withdrawals: "Approve" and "Reject" buttons
4. **Approve**: update status to approved, record reviewed_by and reviewed_at
5. **Reject**: update status to rejected, refund amount back to user's wallet_balance, create a refund transaction record
6. Bulk approve checkbox option for multiple pending withdrawals
7. Add to admin sidebar
