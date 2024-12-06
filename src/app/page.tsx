import { UploadTransactionsForm } from "@/app/ui/overview/upload-transactions-form";
import { DatePicker } from "@/app/ui/overview/date-picker";
import { getTransactionDataFor } from "@/app/use-cases";
import { IbanCommand } from "./ui/overview/iban-command";
import { BudgetCards } from "./ui/overview/budget-cards";
import { VariableExpensesCharts } from "./ui/overview/variable-expenses-charts";
import { Cashflow } from "./ui/overview/cashflow";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionsTable } from "./ui/overview/transactions-table";
import { auth } from "@/auth"
import { Metadata } from "next";

type Props = {
  searchParams?: Promise<{ iban?: string, year?: string, month?: string, ibanCashflow?: string }>
};

export const metadata: Metadata = {
  title: 'Budget'
};

export default async function Home(props: Props) {
  const session = await auth();

  const searchParams = await props.searchParams;
  const now = new Date();
  const year = searchParams?.year ? parseInt(searchParams?.year) : now.getFullYear();
  const month = searchParams?.month ? parseInt(searchParams?.month) - 1 : now.getMonth();
  const ibanCashflow = searchParams?.ibanCashflow;

  const data = await getTransactionDataFor(year, month, searchParams?.iban);

  return (
    <>
      <nav className="p-4 border-solid border-b flex items-center gap-3 flex-wrap justify-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
          <DatePicker year={year} month={month} />

          <IbanCommand ibans={data.ibans} />

          <UploadTransactionsForm />
        </div>

        <div>
          Hello, {session?.user?.name}
        </div>
      </nav>

      <main className="mt-3 m-auto container p-2 flex flex-col gap-3">
        <BudgetCards income={data.incomeLastMonth} expenses={data.expensesFixedLastMonth} budget={data.budgetAvailable} budgetPerWeek={data.budgetPerWeek} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <VariableExpensesCharts expensesPerWeek={data.expensesPerWeek} weeksInMonth={data.weeksInMonth} budgetPerWeek={data.budgetPerWeek} />

          <Suspense fallback={<Skeleton />}>
            <Cashflow year={year} month={month} ibanCashflow={ibanCashflow} />
          </Suspense>
        </div>

        <section>
          <TransactionsTable transactions={data.transactions} />
        </section>
      </main>
    </>
  );
}
