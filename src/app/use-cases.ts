import { getDistinctWeeksInMonth, toIsoWeekNumber } from "@/lib/date";
import { createBudgetApiClient, getTokenHeader } from "@/lib/fetch";
import { Transaction } from "@/lib/models";

const fixedPartyExceptions = ['paypal']

// TODO: Remove all traces from drizzle-orm
// TODO: Add waiting logic for upload
// TODO: Add error handling for upload

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function getTransactionDataFor(year: number, month: number, ibanParam?: string): Promise<TransactionData> {
  const client = createBudgetApiClient();
  const previousStart = new Date(Date.UTC(year, month - 1, 1));
  const current = new Date(Date.UTC(year, month, 1));
  const currentEnd = new Date(Date.UTC(year, month + 1, 0));
  const ibans = await getIbans();
  const iban = ibanParam ?? ibans[0];

  const transactionsResponse = client.GET('/Transactions', {
    params: {
      query: {
        iban: iban,
        startDate: toDateString(previousStart),
        endDate: toDateString(currentEnd)
      }
    },
    headers: await getTokenHeader()
  });

  const transactionsPreviousAndCurrentMonth = (await transactionsResponse).data ?? [];
  const weeksInMonth = getDistinctWeeksInMonth(current);

  let incomeLastMonth = 0;
  let expensesFixedLastMonth = 0;
  const expensesPerWeek = new Map<number, number>();
  const balancePerAccount = new Map<string, number>();
  let incomeFromOwnAccounts = 0;
  let expensesVariable = 0;
  const transactionsCurrentMonth: Transaction[] = [];

  for (const transaction of transactionsPreviousAndCurrentMonth) {
    const transactionDate = new Date(transaction.dateTransaction ?? "");
    const amount = transaction.amount ?? 0;
    const isThisMonth = transactionDate.getMonth() === current.getMonth();
    const isLastMonth = !isThisMonth;
    const weekNumber = toIsoWeekNumber(transactionDate);
    const isIncome = amount > 0;
    const isExpense = !isIncome;
    const isFixed = transaction.authorizationCode != null
      && transaction.authorizationCode !== ''
      && fixedPartyExceptions.every(name => !transaction.nameOtherParty?.toLowerCase().includes(name));
    const isVariable = !isFixed;
    const isFromOwnAccount = ibans.some(i => i === transaction.ibanOtherParty);
    const isFromOtherParty = !isFromOwnAccount;

    if (isLastMonth && isIncome && isFromOtherParty && transaction.cashbackForDate == null) {
      incomeLastMonth += amount;
    }

    if (isLastMonth && isExpense && (isFixed || isFromOwnAccount)) {
      expensesFixedLastMonth += amount;
    }

    if (isThisMonth) {
      transactionsCurrentMonth.push({
        id: transaction.id ?? 0,
        amount: amount,
        balanceAfterTransaction: 0,
        currency: '',
        dateTransaction: transactionDate,
        followNumber: transaction.followNumber ?? 0,
        iban: transaction.iban,
        nameOtherParty: transaction.nameOtherParty ?? "",
        ibanOtherParty: transaction.ibanOtherParty ?? "",
        authorizationCode: transaction.authorizationCode ?? "",
        description: transaction.description ?? "",
        cashbackForDate: transaction.cashbackForDate ? new Date(transaction.cashbackForDate ?? '') : undefined,
        week: weekNumber,
        isFromOtherParty,
        isFixed
      });
    }

    if (isThisMonth && transaction.ibanOtherParty != null && isFromOwnAccount) {
      balancePerAccount.set(transaction.ibanOtherParty, (balancePerAccount.get(transaction.ibanOtherParty) ?? 0) + amount);
    }

    if (isThisMonth && isIncome && isFromOwnAccount && transaction.cashbackForDate == null) {
      incomeFromOwnAccounts += amount;
    }

    if (isThisMonth && isExpense && isVariable && isFromOtherParty) {
      expensesVariable += amount;
      expensesPerWeek.set(weekNumber, (expensesPerWeek.get(weekNumber) ?? 0) + amount);
    }

    if (isThisMonth && isIncome && transaction.cashbackForDate != null) {
      expensesVariable += amount;
      const cashbackWeek = toIsoWeekNumber(new Date(transaction.cashbackForDate));
      expensesPerWeek.set(cashbackWeek, expensesPerWeek.get(cashbackWeek) ?? 0 + amount);
    }
  }

  const budgetAvailable = incomeLastMonth + expensesFixedLastMonth;

  return {
    iban,
    ibans,
    date: current,
    datePrevious: previousStart,
    expensesFixedLastMonth,
    incomeLastMonth,
    weeksInMonth,
    expensesVariable: expensesVariable,
    expensesPerWeek: expensesPerWeek,
    incomeFromOwnAccounts: incomeFromOwnAccounts,
    transactions: transactionsCurrentMonth,
    balancePerAccount: balancePerAccount,
    budgetAvailable: incomeLastMonth + expensesFixedLastMonth,
    budgetPerWeek: weeksInMonth.length > 0 ? Math.floor(budgetAvailable / weeksInMonth.length) : 0
  };
}

export type TransactionData = {
    iban : string;
    ibans : string[];
    date: Date;
    datePrevious: Date;
    expensesFixedLastMonth : number;
    incomeLastMonth: number;
    weeksInMonth: number[];
    expensesVariable: number
    expensesPerWeek: Map<number, number>;
    incomeFromOwnAccounts: number;
    transactions: Transaction[];
    balancePerAccount: Map<string, number>;
    budgetAvailable: number;
    budgetPerWeek: number;
};

async function getIbans() {
  const client = createBudgetApiClient();
  const ibansResponse = client.GET('/Transactions/ibans', { headers: await getTokenHeader() });
  const ibansByCount = (await ibansResponse).data ?? [];

  return ibansByCount;
}

export async function getCashflowOf(year: number, month: number, iban?: string) {
  const client = createBudgetApiClient();
  const dateStart = new Date(Date.UTC(year, month - 6, 1));
  const dateEnd = new Date(Date.UTC(year, month + 1, 0));

  const cashflowResponse = await client.GET('/Transactions/cashflow-per-iban', {
    params: {
      query: {
        startDate: toDateString(dateStart),
        endDate: toDateString(dateEnd),
        iban: iban
      }
    },
    headers: await getTokenHeader()
  });

  return cashflowResponse.data;
}
