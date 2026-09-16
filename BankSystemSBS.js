/* Step-by-step process:

    1. create an account for each user with an initial balance and an empty transaction history.
    2. when logged in, user can view their account balance and transaction history.
    3. When a transaction request comes in, identify the type of transaction (deposit, withdrawal, or transfer), the source account, the amount, and the destination account if applicable.
    4. Verify that the source account exists.
    5. Receive the transaction request.
    6. Identify the transaction type, source account, amount, and destination account if needed.
    7. Verify that the required accounts exist.
    8. Verify that the amount is a positive number.
    9. Check that the source account has enough money for withdrawals and transfers.
    10. Check whether the transaction violates the rapid-withdrawal limit.
    11. Compare the transaction amount with the account's average transaction amount.
    12. Reject the transaction and return an error if any check fails.
    13. Apply the transaction if all checks pass.
    14. Update account balances, timestamps, and transaction histories.
    15. Recalculate the average transaction amount.
    16. Return a success message with the transaction details and updated balances.*/
