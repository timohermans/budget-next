import { UploadTransactionsForm } from "@/app/ui/overview/upload-transactions-form";
import { DatePicker } from "@/app/ui/overview/date-picker";
import { getTransactionDataFor } from "@/app/use-cases";
import { IbanCommand } from "./ui/overview/iban-command";
import { BudgetCards } from "./ui/overview/budget-cards";
import { VariableExpensesCharts } from "./ui/overview/variable-expenses-charts";

type Props = {
  searchParams?: { iban?: string, year?: string, month?: string }
};

export default async function Home(props: Props) {
  const searchParams = await props.searchParams;
  const now = new Date();
  const year = searchParams?.year ? parseInt(searchParams?.year) : now.getFullYear();
  const month = searchParams?.month ? parseInt(searchParams?.month) - 1 : now.getMonth();

  const data = await getTransactionDataFor(year, month, searchParams?.iban);

  return (
    <>
      <nav className="p-4 border-solid border-b flex items-center gap-3 flex-wrap">
        <DatePicker year={year} month={month} />

        <IbanCommand ibans={data.ibans} />

        <UploadTransactionsForm />
      </nav>

      <main className="mt-3 m-auto container p-2 flex flex-col gap-3">
        <BudgetCards year={year} month={month} income={data.incomeLastMonth} expenses={data.expensesFixedLastMonth} budget={data.budgetAvailable} budgetPerWeek={data.budgetPerWeek} />

        <VariableExpensesCharts expensesPerWeek={data.expensesPerWeek} weeksInMonth={data.weeksInMonth} budgetPerWeek={data.budgetPerWeek} />
      </main>
    </>
  );
}
