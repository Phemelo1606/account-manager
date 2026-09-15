/*algorithm for processing a transaction:
Inputs:
    - transaction type: deposit, withdrawal, or transfer
    - source account ID
    - transaction amount
    - destination account ID, required only for transfers

    Process:

        1. Create accounts.
            - Each account starts with an initial balance and an empty transaction history.
            - Each account keeps a list of withdrawal timestamps for the last 10 seconds.

        2. Receive the transaction request.
            - Read the transaction type, source account, amount, and destination account if needed.

        3. Validate the request.
            - Confirm that the transaction type is deposit, withdrawal, or transfer.
            - Confirm that the source account exists.
            - Confirm that the amount is a positive number.
            - For transfers, confirm that the destination account exists and is different
              from the source account.
            - Reject the request immediately if any validation fails.

        4. Check the source account balance.
            - For withdrawals and transfers, confirm that the source account has enough
              money for the requested amount.
            - Reject the request if the amount is greater than the current balance.

        5. Check for rapid withdrawals.
            - Remove withdrawal timestamps older than 10 seconds.
            - If the request is a withdrawal and 3 withdrawals already occurred within the
              last 10 seconds, reject the request.

        6. Check for an unusual spending spike.
            - Calculate the average successful transaction amount when history exists.
            - For withdrawals and transfers, reject the request if the amount is at least
              5 times the account's average transaction amount.

        7. Apply the transaction only if all checks pass.
            - Deposit: increase the source account balance.
            - Withdrawal: decrease the source account balance and record the timestamp.
            - Transfer: decrease the source balance and increase the destination balance.

        8. Update records.
            - Record each successful transaction in the correct transaction history.
            - Recalculate the account's average transaction amount.
            - Do not modify balances or history when a check fails.

        9. Return the result.
            - On success, return a success message, transaction details, and updated balances.
            - On failure, return an error message explaining which rule blocked the transaction.

        10. Allow the user to view the account balance and transaction history when logged in.

*/

