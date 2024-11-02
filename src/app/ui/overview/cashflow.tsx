
import { getCashflowOf } from "@/app/use-cases";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, Line } from "recharts";
import { CashflowLineChart } from "./cashflow-line-chart";
import { TrendingDown, TrendingUpIcon } from "lucide-react";


export async function Cashflow({ year, month, ibanCashflow }: { year: number, month: number, ibanCashflow?: string }) {

  const data = await getCashflowOf(year, month, ibanCashflow);

  let balanceAtStart = { date: '', balance: 0 };
  let balanceAtEnd = { date: '', balance: 0 };

  if (data.balancesPerDate.length > 2) {
    balanceAtStart = data.balancesPerDate[0];
    balanceAtEnd = data.balancesPerDate[data.balancesPerDate.length - 1];
  }

  const dateAtStart = balanceAtStart.date;
  const balanceDiff = balanceAtEnd.balance - balanceAtStart.balance;
  const isBalanceGained = balanceDiff > 0;
  const balanceDiffAbs = Math.abs(balanceDiff);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Balans</CardTitle>
        <CardDescription>Geld dat we hebben op rekening {data.ibanCashflow}</CardDescription>
      </CardHeader>
      <CardContent>
        <CashflowLineChart balancesPerDate={data.balancesPerDate} />
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
