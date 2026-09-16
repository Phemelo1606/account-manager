const WITHDRAWAL_WINDOW_MS: number = 10 * 1000; // 10 seconds
const MAX_WITHDRAWALS_IN_WINDOW: number = 3;
const SUSPICIOUS_MULTIPLIER: number = 5;

type Account = {
  balance: number;
  withdrawalTimestamps: number[];
  transactionHistory: { successful: boolean; amount: number }[];
  averageTransactionAmount: number;
};

function failure(message: string) {
  return { ok: false, error: message };
}

function success(transaction: object, sourceBalance: number, destinationBalance?: number) {
  const result: {ok: boolean;transaction: object;sourceBalance: number;destinationBalance?: number;
  } = { ok: true, transaction, sourceBalance };
  if (destinationBalance !== undefined) {
    result.destinationBalance = destinationBalance;
  }
  return result;
}

function createTransaction(type: string, amount: number, timestamp: number) {
  return {
    type,
    amount,
    timestamp,
    successful: true,
  };
}

function average(numbers: number[]) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum: number, n: number) => sum + n, 0) / numbers.length;
}

function averageSuccessfulAmount(transactionHistory: {successful:boolean, amount: number}[]) {
  const successfulAmounts = transactionHistory
    .filter((t) => t.successful === true)
    .map((t) => t.amount);
  return average(successfulAmounts);
}


function processTransaction(
  type: string,
  sourceAccountId: string,
  amount: number,
  destinationAccountId: string,
  currentTime: number,
  findAccount: (id: string) => Account|null
) {
  if (type !== "deposit" && type !== "withdrawal" && type !== "transfer") {
    return failure("Invalid transaction type");
  }

  const sourceAccount = findAccount(sourceAccountId);
  if (sourceAccount === null || sourceAccount === undefined) {
    return failure("Source account does not exist");
  }

  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
    return failure("Amount must be greater than zero");
  }

  let destinationAccount = null;
  if (type === "transfer") {
    destinationAccount = findAccount(destinationAccountId);

    if (destinationAccount === null || destinationAccount === undefined) {
      return failure("Destination account does not exist");
    }

    if (sourceAccountId === destinationAccountId) {
      return failure("Cannot transfer to the same account");
    }
  }

  if (type === "withdrawal" || type === "transfer") {
    if (amount > sourceAccount.balance) {
      return failure("Insufficient funds");
    }

    sourceAccount.withdrawalTimestamps = sourceAccount.withdrawalTimestamps.filter(
      (timestamp) => timestamp >= currentTime - WITHDRAWAL_WINDOW_MS
    );
    const recentWithdrawals = sourceAccount.withdrawalTimestamps;

    if (type === "withdrawal" && recentWithdrawals.length >= MAX_WITHDRAWALS_IN_WINDOW) {
      return failure("Too many withdrawals in 10 seconds");
    }

    if (sourceAccount.transactionHistory.length > 0) {
      const averageAmount = averageSuccessfulAmount(sourceAccount.transactionHistory);

      if (amount >= averageAmount * SUSPICIOUS_MULTIPLIER) {
        return failure("Transaction flagged as suspicious");
      }
    }
  }

  const transaction = createTransaction(type, amount, currentTime);

  if (type === "deposit") {
    sourceAccount.balance += amount;
  } else if (type === "withdrawal") {
    sourceAccount.balance -= amount;
    sourceAccount.withdrawalTimestamps.push(currentTime);
  } else if (type === "transfer") {
    sourceAccount.balance -= amount;
    destinationAccount!.balance += amount;
  }

  sourceAccount.transactionHistory.push(transaction);

  if (type === "transfer") {
    const incomingTransaction = createTransaction("deposit", amount, currentTime);
    destinationAccount!.transactionHistory.push(incomingTransaction);
  }

  sourceAccount.averageTransactionAmount = averageSuccessfulAmount(
    sourceAccount.transactionHistory
  );

  if (type === "transfer") {
    return success(transaction, sourceAccount.balance, destinationAccount!.balance);
  }

  return success(transaction, sourceAccount.balance);
}