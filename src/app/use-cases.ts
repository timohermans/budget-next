import { db } from "@/db";
import { transactions } from "@/db/schema";
import { and, between, desc, eq, sql } from "drizzle-orm";
import Papa from "papaparse";


export async function addTransactionsFrom(file: File) {
    // todo: add validation
    var enc = new TextDecoder("utf-8");
    const arrBuffer = await file.arrayBuffer();
    const csvContent = enc.decode(arrBuffer);
    console.log(csvContent);
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

function toDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

export async function getTransactionDataFor(year: number, month: number, ibanParam?: string) {
    const previousStart = new Date(year, month - 1, 1);
    const previousEnd = new Date(year, month - 1, 0);
    const current = new Date(year, month, 1);
    const ibans = await getIbans();
    const iban = ibanParam ?? ibans[0];
    const transactionsPreviousAndCurrentMonth = await db
        .select({
            followNumber: transactions.followNumber,
            iban: transactions.iban,
            amount: transactions.amount,
            date: transactions.dateTransaction,
            nameOtherParty: transactions.nameOtherParty,
            ibanOtherParty: transactions.ibanOtherParty,
            authorizationCode: transactions.authorizationCode,
            description: transactions.description
        })
        .from(transactions)
        .where(and(
            between(transactions.dateTransaction, toDate(previousStart), toDate(previousEnd)),
            eq(transactions.iban, iban)
        ));

    const incomeLastMonth = 0;
    const expensesFixedLastMonth = 0;
    const expensesPerWeek = new Map<number, number>();
    const balancePerAccount = new Map<string, number>();
    const incomeFromOwnAccounts = 0;
    const expensesVariable = 0;

    for (const transaction of transactionsPreviousAndCurrentMonth) {
        const transactionDate = new Date(transaction.date);
        const transactionAmount = parseInt(transaction.amount);
        const isThisMonth = transactionDate.getMonth() === current.getMonth();
        const weekNumber = toIsoWeekNumber(transactionDate);
        const isIncome = transactionAmount > 0;
        const isFixed = !!transaction.authorizationCode


    }

}

function toIsoWeekNumber(date: Date): number {
    // Get the day of week where 0 = Sunday, 1 = Monday, etc.
    const dayOfWeek = date.getDay();
    
    // Convert Sunday (0) to 7 to match ISO week calculations
    const correctedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    
    // Move date to Thursday of the same week
    // This is done by adding the number of days to reach Thursday
    // (4 - correctedDayOfWeek) handles this calculation
    const targetThursday = new Date(date);
    targetThursday.setDate(date.getDate() + (4 - correctedDayOfWeek));
    
    // Get January 1st of the target Thursday's year
    const yearStart = new Date(targetThursday.getFullYear(), 0, 1);
    
    // Calculate full weeks between yearStart and targetThursday
    const weekNumber = Math.ceil(
        (((targetThursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7
    );
    
    return weekNumber;
}

async function getIbans() {
    const ibansByCount = await db
        .selectDistinct({ iban: transactions.iban, ibanCount: sql<number>`cast(count(${transactions.iban}) as int)` })
        .from(transactions)
        .groupBy(transactions.iban)
        .orderBy(({ ibanCount }) => desc(ibanCount));

    return ibansByCount.map(i => i.iban);
}
