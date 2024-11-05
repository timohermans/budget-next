import { db } from "@/db";
import { transactions, TransactionsSelect } from "@/db/schema";
import { getDistinctWeeksInMonth, toIsoWeekNumber } from "@/lib/date";
import { and, between, desc, eq, inArray, InferSelectModel, max, sql } from "drizzle-orm";
import Papa from "papaparse";


export async function addTransactionsFrom(file: File) {
  // todo: add validation
  var enc = new TextDecoder("utf-8");
  const arrBuffer = await file.arrayBuffer();
  const csvContent = enc.decode(arrBuffer);
  if (!csvContent) return;

  const transactionsParsed = await parse(csvContent);

  await db
    .insert(transactions)
    .values(transactionsParsed)
    .onConflictDoNothing();
}

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
  return new Promise((resolve, reject) => {
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

export type TransactionGet = Omit<InferSelectModel<typeof transactions>, "currency" | "balanceAfterTransaction"> & { week: number, isFromOtherParty: boolean };

export async function getTransactionDataFor(year: number, month: number, ibanParam?: string) {
  const previousStart = new Date(Date.UTC(year, month - 1, 1));
  const current = new Date(Date.UTC(year, month, 1));
  const currentEnd = new Date(Date.UTC(year, month + 1, 0));
  const ibans = await getIbans();
  const iban = ibanParam ?? ibans[0];

  const transactionsPreviousAndCurrentMonth = await db
    .select({
      id: transactions.id,
      followNumber: transactions.followNumber,
      iban: transactions.iban,
      amount: transactions.amount,
      dateTransaction: transactions.dateTransaction,
      nameOtherParty: transactions.nameOtherParty,
      ibanOtherParty: transactions.ibanOtherParty,
      authorizationCode: transactions.authorizationCode,
      description: transactions.description,
      cashbackForDate: transactions.cashbackForDate
    })
    .from(transactions)
    .where(and(
      between(transactions.dateTransaction, toDateString(previousStart), toDateString(currentEnd)),
      eq(transactions.iban, iban)
    ))
    .orderBy(desc(transactions.dateTransaction));

  let weeksInMonth = getDistinctWeeksInMonth(current);

  let incomeLastMonth = 0;
  let expensesFixedLastMonth = 0;
  let expensesPerWeek = new Map<number, number>();
  let balancePerAccount = new Map<string, number>();
  let incomeFromOwnAccounts = 0;
  let expensesVariable = 0;
  let transactionsCurrentMonth: TransactionGet[] = [];

  for (const transaction of transactionsPreviousAndCurrentMonth) {
    const transactionDate = new Date(transaction.dateTransaction);
    const amount = parseFloat(transaction.amount);
    const isThisMonth = transactionDate.getMonth() === current.getMonth();
    const isLastMonth = !isThisMonth;
    const weekNumber = toIsoWeekNumber(transactionDate);
    const isIncome = amount > 0;
    const isExpense = !isIncome;
    const isFixed = transaction.authorizationCode != null && transaction.authorizationCode !== '';
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
        ...transaction,
        week: weekNumber,
        isFromOtherParty
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
      var cashbackWeek = toIsoWeekNumber(new Date(transaction.cashbackForDate));
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
  const ibansByCount = await db
    .selectDistinct({ iban: transactions.iban, ibanCount: sql<number>`cast(count(${transactions.iban}) as int)` })
    .from(transactions)
    .groupBy(transactions.iban)
    .orderBy(({ ibanCount }) => desc(ibanCount));

  return ibansByCount.map(i => i.iban);
}

export async function getCashflowOf(year: number, month: number, iban?: string) {
  const dateStart = new Date(Date.UTC(year, month - 6, 1));
  const dateEnd = new Date(Date.UTC(year, month + 1, 0));

  let ibanCashflow = iban;
  // if there's no iban selected, get the account with the most money
  if (iban == null || iban === '') {
    const ibanBalances = await db
      .select({
        iban: transactions.iban,
        balance: max(transactions.balanceAfterTransaction)
      })
      .from(transactions)
      .where(between(transactions.dateTransaction, toDateString(dateStart), toDateString(dateEnd)))
      .groupBy(transactions.iban)
      .orderBy(q => desc(q.balance));

    if (ibanBalances.length > 0) {
      ibanCashflow = ibanBalances[0]?.iban;
    }
  }

  if (ibanCashflow == null) return {
    ibanCashflow: "Geen",
    balancesPerDate: []
  };

  const lastTransactionPerDateQuery = db.select({ date: transactions.dateTransaction, followNumber: max(transactions.followNumber).as('followNumber') })
    .from(transactions)
    .where(and(
      eq(transactions.iban, ibanCashflow),
      between(transactions.dateTransaction, toDateString(dateStart), toDateString(dateEnd))
    ))
    .groupBy(transactions.dateTransaction)
    .as('dbf');

  const balancesPerDate = await db
    .select({
      date: transactions.dateTransaction,
      balance: transactions.balanceAfterTransaction
    })
    .from(transactions)
    .innerJoin(
      lastTransactionPerDateQuery,
      and(
        eq(transactions.dateTransaction, lastTransactionPerDateQuery.date),
        eq(transactions.followNumber, lastTransactionPerDateQuery.followNumber)
      )
    )
    .orderBy(q => q.date);

  return {
    ibanCashflow,
    balancesPerDate: balancesPerDate.map(bpd => (
      {
        date: `${bpd.date.split('-')[2]}-${bpd.date.split('-')[1]}`,
        balance: parseFloat(bpd.balance)
      }))
  };
}
