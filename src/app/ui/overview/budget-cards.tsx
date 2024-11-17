import { BadgeEuroIcon, EqualIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { SummaryCard } from "./summary-card";

export async function BudgetCards({
  income,
  expenses,
  budget,
  budgetPerWeek
}: {
  income: number,
  expenses: number,
  budget: number,
  budgetPerWeek: number
}) {
  return (
    <section>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard title="Inkomen" icon={<TrendingUpIcon className="text-slate-400" />} contentMain={income.toFixed(2)} contentSub="Verdiend vorige maand" />
        <SummaryCard title="Uitgaven" icon={<TrendingDownIcon className="text-slate-400" />} contentMain={expenses.toFixed(2)} contentSub="Vaste lasten vorige maand" />
        <SummaryCard title="Budget" icon={<EqualIcon className="text-slate-400" />} contentMain={budget.toFixed(2)} contentSub="Uit te geven deze maand" />
        <SummaryCard title="Iedere week" icon={<BadgeEuroIcon className="text-slate-400" />} contentMain={budgetPerWeek.toFixed(2)} contentSub="Iedere week deze maand" />
      </div>
    </section>
  );
}
