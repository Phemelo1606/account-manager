const WITHDRAWAL_WINDOW_MS: number = 10 * 1000; // 10 seconds
const MAX_WITHDRAWALS_IN_WINDOW: number = 3;
const SUSPICIOUS_MULTIPLIER: number = 5;


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