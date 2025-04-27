import { getDistinctWeeksInMonth, toIsoWeekNumber } from "@/lib/date";
import Papa from "papaparse";
import { createBudgetApiClient, getTokenHeader } from "@/lib/fetch";
import { Transaction } from "@/lib/models";

const fixedPartyExceptions = ['paypal']

// TODO: Remove all traces from drizzle-orm
// TODO: Add waiting logic for upload
// TODO: Add error handling for upload

function formatNumber(numberStr: string): string {
  return numberStr.replace(',', '.').replace('+', '');
}

function parse(csvContent: string): Promise<{
  followNumber: number;
  iban: string;
  currency: string;
  amount: string;
  dateTransaction: string;
  balanceAfterTransaction: string;
  nameOtherParty: string;
  ibanOtherParty: string;
  authorizationCode: string;
  description: string;
  cashbackForDate: null;
}[]> {
  return new Promise((resolve) => {
    Papa.parse(csvContent, {
      header: true,
      worker: false,
      complete(results) {
        const rows = results.data as { [key: string]: string | undefined }[];
        const transactions = rows
          .filter(r => !!r['Datum'])
          .map(row => {
            return {
              followNumber: parseInt(row['Volgnr'] ?? '0'),
              iban: row['IBAN/BBAN'] ?? '',
              currency: row['Munt'] ?? '',
              amount: formatNumber(row['Bedrag'] ?? '0'),
              dateTransaction: row['Datum'] ?? '',
              balanceAfterTransaction: formatNumber(row['Saldo na trn'] ?? '0'),
              nameOtherParty: row['Naam tegenpartij'] ?? '',
              ibanOtherParty: row['Tegenrekening IBAN/BBAN'] ?? '',
              authorizationCode: row['Machtigingskenmerk'] ?? '',
              description: row['Omschrijving-1'] ?? '' + row['Omschrijving-2'] ?? '' + row['Omschrijving-3'] ?? '',
              cashbackForDate: null,
            };
          });
        resolve(transactions);
      },
    });
  })
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function getTransactionDataFor(year: number, month: number, ibanParam?: string) {
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
