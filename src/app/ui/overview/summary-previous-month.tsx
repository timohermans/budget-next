import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { BadgeEuroIcon, EqualIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { SummaryCard } from "./summary-card";

export async function SummaryPreviousMonth() {
    // const summary = await getSummaryFor();

    return (
        <section>
            <div className="grid grid-cols-4 gap-4">
                <SummaryCard title="Inkomen" icon={<TrendingUpIcon className="text-slate-400" />} contentMain="€5500.31" contentSub="Verdiend vorige maand" />
                <SummaryCard title="Uitgaven" icon={<TrendingDownIcon className="text-slate-400" />} contentMain="€-3300.31" contentSub="Vaste lasten vorige maand" />
                <SummaryCard title="Budget" icon={<EqualIcon className="text-slate-400" />} contentMain="€2200.00" contentSub="Uit te geven deze maand" />
                <SummaryCard title="Iedere week" icon={<BadgeEuroIcon className="text-slate-400" />} contentMain="€400" contentSub="Iedere week deze maand" />
            </div>
        </section>
    );
}