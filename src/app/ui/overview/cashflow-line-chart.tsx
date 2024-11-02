"use client"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, XAxis, Line, LineChart, YAxis } from "recharts";

type ChartData = {
  date: string,
  balance: number,
};

const chartConfig = {
  date: {
    label: "Datum",
    color: "hsl(var(--chart-3))",
  }
} satisfies ChartConfig;

export function CashflowLineChart({ balancesPerDate }: { balancesPerDate: ChartData[] }) {
  return (
    <ChartContainer config={chartConfig}>
      <LineChart accessibilityLayer data={balancesPerDate}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          tickMargin={2}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 5)}
        />
        <YAxis />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Line
          dataKey="balance"
          type="natural"
          stroke="var(--color-date)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer >
  );
}
