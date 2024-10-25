import { ChevronLeftIcon, ChevronRightIcon, UploadIcon } from "@radix-ui/react-icons";
import { ButtonIcon } from "@/app/ui/button-icon";
import { UploadTransactionsForm } from "@/app/ui/overview/upload-transactions-form";
import { IbanCommandWrapper } from "@/app/ui/overview/iban-command-wrapper";
import { Suspense } from "react";
import { InputSkeleton } from "@/app/ui/input-skeleton";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { TrendingUpIcon } from "lucide-react";
import { SummaryPreviousMonth } from "./ui/overview/summary-previous-month";

type Props = {
  searchParams?: { iban?: string }
};

export default async function Home(props: Props) {
  const searchParams = await props.searchParams;

  return (
    <>
      <nav className="p-4 border-solid border-b flex items-center gap-3">
        <ButtonIcon>
          <ChevronLeftIcon className="h-4 w-4" />
        </ButtonIcon>
        <div className="font-bold text-lg">
          2024-10
        </div>
        <ButtonIcon>
          <ChevronRightIcon className="h-4 w-4" />
        </ButtonIcon>

        <Suspense fallback={<InputSkeleton />}>
          <IbanCommandWrapper />
        </Suspense>

        <UploadTransactionsForm />
      </nav>

      <main className="mt-3 m-auto container">
        <SummaryPreviousMonth />
      </main>
    </>
  );
}
