import { UploadTransactionsForm } from "@/app/ui/overview/upload-transactions-form";
import { Suspense } from "react";
import { BudgetCards } from "@/app/ui/overview/budget-cards";
import { DatePicker } from "@/app/ui/overview/date-picker";
import { IbanCommand } from "@/app/ui/overview/iban-command";

type Props = {
  searchParams?: { iban?: string, year?: string, month?: string }
};

export default async function Home(props: Props) {
  const searchParams = await props.searchParams;
  const now = new Date();
  const year = searchParams?.year ? parseInt(searchParams?.year) : now.getFullYear();
  const month = searchParams?.month ? parseInt(searchParams?.month) - 1 : now.getMonth();

  // const data = await getTransactionDataFor(year, month, searchParams?.iban);

  return (
    <>
      <nav className="p-4 border-solid border-b flex items-center gap-3">
        <DatePicker year={year} month={month} />

        {/* <IbanCommand ibans={data.ibans} /> */}

        <UploadTransactionsForm />
      </nav>

      <main className="mt-3 m-auto container p-2">
        {/* <BudgetCards /> */}
      </main>
    </>
  );
}
