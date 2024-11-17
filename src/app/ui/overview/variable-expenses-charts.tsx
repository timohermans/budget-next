"use client"

import { TrendingDown, TrendingUp } from "lucide-react"
import { Bar, CartesianGrid, ComposedChart, Line, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A bar chart with a label";

type ChartData = {
  week: string,
  expenses: number,
  budget: number,
  isOverBudget: boolean
};

const chartConfig = {
  week: {
    label: "Uitgaven",
    color: "hsl(var(--chart-3))",
  },
  budget: {
    label: "budget",
    color: "hsl(var(--chart-2))"
  }
} satisfies ChartConfig;

export function VariableExpensesCharts({
  weeksInMonth,
  expensesPerWeek,
  budgetPerWeek
}: {
  weeksInMonth: number[],
  expensesPerWeek: Map<number, number>,
  budgetPerWeek: number
}) {
  const chartData: ChartData[] = weeksInMonth.map(week => {
    const expenses = (expensesPerWeek.get(week) ?? 0) * -1;
    const isOverBudget = expenses > budgetPerWeek;
    return {
      week: `w${week}`,
      expenses,
      budget: budgetPerWeek,
      isOverBudget
    }
  });

  const firstWeek = weeksInMonth.at(0);
  const lastWeek = weeksInMonth.at(weeksInMonth.length - 1);
  const weeksOverBudget = chartData.filter(d => d.isOverBudget).length;
  const amountOfWeeks = weeksInMonth.length;
  let totalSpent = 0;

  for (const [, expenses] of expensesPerWeek) {
    totalSpent += (expenses * -1);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uitgaven per week</CardTitle>
        <CardDescription>Week {firstWeek} tot en met {lastWeek}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ComposedChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="expenses" fill="var(--color-week)" radius={8} />
            <Line
              dataKey="budget"
              type="natural"
              stroke="var(--color-budget)"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          €{totalSpent.toFixed(2)} in totaal uitgegeven. {weeksOverBudget} van de {amountOfWeeks} weken over budget {weeksOverBudget > 2 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
        </div>
        <div className="leading-none text-muted-foreground">
          Iedere balk geeft uitgaven van die week weer. <br />
          Als de balk boven de lijn komt zijn we over budget die week.
        </div>
      </CardFooter>
    </Card>
  )
}
