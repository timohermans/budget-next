import { db } from "@/db";
import { transactions } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import Papa from "papaparse";


export async function getIbans() {
    const ibansByCount = await db
        .selectDistinct({ iban: transactions.iban, ibanCount: sql<number>`cast(count(${transactions.iban}) as int)` })
        .from(transactions)
        .groupBy(transactions.iban)
        .orderBy(({ ibanCount }) => desc(ibanCount));

    return ibansByCount.map(i => i.iban);
}

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