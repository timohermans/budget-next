
import { getCashflowOf } from "@/app/use-cases";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { CashflowLineChart } from "./cashflow-line-chart";
import { TrendingDown, TrendingUpIcon } from "lucide-react";

export async function Cashflow({ year, month, ibanCashflow }: { year: number, month: number, ibanCashflow?: string }) {

  const data = await getCashflowOf(year, month, ibanCashflow);

  let balanceAtStart = { date: '', balance: 0 };
  let balanceAtEnd = { date: '', balance: 0 };
  
  if (!data) return null;

  const balancesPerDate = data.balancesPerDate.map(bpd => ({
    date: bpd.date ?? '',
    balance: bpd.balance ?? 0
  }));

  if (balancesPerDate.length > 2) {
    balanceAtStart = balancesPerDate[0];
    balanceAtEnd = balancesPerDate[data.balancesPerDate.length - 1];
  }

  const dateAtStart = balanceAtStart.date;
  const balanceDiff = balanceAtEnd.balance - balanceAtStart.balance;
  const isBalanceGained = balanceDiff > 0;
  const balanceDiffAbs = Math.abs(balanceDiff);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balans</CardTitle>
        <CardDescription>Geld dat we hebben op rekening {data.iban}</CardDescription>
      </CardHeader>
      <CardContent>
        <CashflowLineChart balancesPerDate={balancesPerDate} />
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Sinds {dateAtStart} hebben we €{balanceDiffAbs.toFixed(2)} {isBalanceGained ? 'gespaard' : 'uitgegeven'}.
          {isBalanceGained ? <TrendingUpIcon className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        </div>
        <div className="leading-none text-muted-foreground">
          Deze grafiek geeft de laatste 4 maanden historie van deze rekening.
        </div>
      </CardFooter>
    </Card>
  );
}
