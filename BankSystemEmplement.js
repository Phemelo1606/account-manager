
const WITHDRAWAL_WINDOW_MS = 10 * 1000; // 10 seconds
const MAX_WITHDRAWALS_IN_WINDOW = 3;
const SUSPICIOUS_MULTIPLIER = 5;

function failure(message) {
  return { ok: false, error: message };
}

function success(transaction, sourceBalance, destinationBalance) {
  const result = { ok: true, transaction, sourceBalance };
  if (destinationBalance !== undefined) {
    result.destinationBalance = destinationBalance;
  }
  return result;
}

function createTransaction(type, amount, timestamp) {
  return {
    type,
    amount,
    timestamp,
    successful: true,
  };
}

function average(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function averageSuccessfulAmount(transactionHistory) {
  const successfulAmounts = transactionHistory
    .filter((t) => t.successful === true)
    .map((t) => t.amount);
  return average(successfulAmounts);
}

/**
 * @param {"deposit"|"withdrawal"|"transfer"} type
 * @param {string} sourceAccountId
 * @param {number} amount
 * @param {string|null} destinationAccountId
 * @param {number} currentTime - epoch ms
 * @param {(id: string) => object|null} findAccount
 */
function processTransaction(
  type,
  sourceAccountId,
  amount,
  destinationAccountId,
  currentTime,
  findAccount
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
    destinationAccount.balance += amount;
  }

  sourceAccount.transactionHistory.push(transaction);

  if (type === "transfer") {
    const incomingTransaction = createTransaction("deposit", amount, currentTime);
    destinationAccount.transactionHistory.push(incomingTransaction);
  }

  sourceAccount.averageTransactionAmount = averageSuccessfulAmount(
    sourceAccount.transactionHistory
  );

  if (type === "transfer") {
    return success(transaction, sourceAccount.balance, destinationAccount.balance);
  }

  return success(transaction, sourceAccount.balance);
}

module.exports = { processTransaction };

async function runInteractive() {
  const readline = require("readline/promises");
  const accounts = new Map([
    ["alice", {
      id: "alice",
      balance: 1000,
      withdrawalTimestamps: [],
      transactionHistory: [],
    }],
    ["bob", {
      id: "bob",
      balance: 500,
      withdrawalTimestamps: [],
      transactionHistory: [],
    }],
  ]);

  const isTerminal = process.stdin.isTTY;
  let interface = null;
  let scriptedAnswers = [];

  if (isTerminal) {
    interface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  } else {
    const input = await new Promise((resolve) => {
      let data = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => { data += chunk; });
      process.stdin.on("end", () => resolve(data));
    });
    scriptedAnswers = input.split(/\r?\n/);
  }

  const ask = (question) => {
    if (!isTerminal) {
      process.stdout.write(question);
      return Promise.resolve(scriptedAnswers.shift() || "");
    }
    return interface.question(question);
  };
  const findAccount = (accountId) => accounts.get(accountId) || null;

  console.log("Bank account manager");
  console.log("Available accounts: alice, bob");

  try {
    while (true) {
      console.log("\n1. View account\n2. Make transaction\n3. Exit");
      const choice = (await ask("Choose an option: ")).trim();

      if (choice === "1") {
        const accountId = (await ask("Account ID: ")).trim();
        const account = findAccount(accountId);
        if (!account) {
          console.log("Account does not exist.");
          continue;
        }
        console.log(JSON.stringify({
          id: account.id,
          balance: account.balance,
          transactionHistory: account.transactionHistory,
        }, null, 2));
      } else if (choice === "2") {
        const type = (await ask("Transaction type (deposit, withdrawal, transfer): ")).trim();
        const sourceAccountId = (await ask("Source account ID: ")).trim();
        const amount = Number((await ask("Amount: ")).trim());
        let destinationAccountId = null;

        if (type === "transfer") {
          destinationAccountId = (await ask("Destination account ID: ")).trim();
        }

        const result = processTransaction(
          type,
          sourceAccountId,
          amount,
          destinationAccountId,
          Date.now(),
          findAccount
        );
        console.log(JSON.stringify(result, null, 2));
      } else if (choice === "3") {
        break;
      } else {
        console.log("Invalid option.");
      }
    }
  } finally {
    if (interface) interface.close();
  }
}

if (require.main === module) {
  runInteractive();
}