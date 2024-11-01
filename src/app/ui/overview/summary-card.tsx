import { Card, CardTitle, CardContent } from "@/components/ui/card";

export function SummaryCard(
  { title, icon, contentMain, contentSub }:
    { title: string, icon: React.ReactNode, contentMain: string, contentSub?: string }
) {
  return (
    <Card className="p-3">
      <CardTitle className="font-normal flex justify-between pt-3 px-3">
        <span>{title}</span>
        {icon}
      </CardTitle>
      <CardContent className="p-3">
        <div className="text-xl font-bold">€{contentMain}</div>
        {contentSub && <div className="text-sm text-slate-500">{contentSub}</div>}
      </CardContent>
    </Card>
  );
}
