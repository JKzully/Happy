import { Card } from "@/components/ui/card";
import { formatKr } from "@/lib/format";
import { cn } from "@/lib/cn";

export function BenchmarkBar({
  avgRevenue,
  avgAdSpend,
  avgBoxes,
  todayVsAvgPercent,
  vsLastYearPercent,
}: {
  avgRevenue: number;
  avgAdSpend: number;
  avgBoxes: number;
  todayVsAvgPercent: number;
  vsLastYearPercent: number;
}) {
  return (
    <Card className="flex items-center gap-8 px-6 py-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
        30d meðaltal
      </span>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-6 text-sm">
        <span className="text-text-dim">
          Tekjur:{" "}
          <span className="font-semibold text-foreground">
            {formatKr(avgRevenue)}
          </span>
        </span>
        <span className="text-text-dim">
          Augl:{" "}
          <span className="font-semibold text-foreground">
            {formatKr(avgAdSpend)}
          </span>
        </span>
        <span className="text-text-dim">
          Kassar:{" "}
          <span className="font-semibold text-foreground">{avgBoxes}</span>
        </span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-6 text-sm">
        <span className="text-text-dim">
          Í dag vs meðaltal:{" "}
          <span
            className={cn(
              "font-semibold",
              todayVsAvgPercent >= 0 ? "text-primary" : "text-danger"
            )}
          >
            {todayVsAvgPercent >= 0 ? "+" : ""}
            {todayVsAvgPercent}%
          </span>
        </span>
        <span className="text-text-dim">
          Sami dagur í fyrra:{" "}
          <span
            className={cn(
              "font-semibold",
              vsLastYearPercent >= 0 ? "text-primary" : "text-danger"
            )}
          >
            {vsLastYearPercent >= 0 ? "+" : ""}
            {vsLastYearPercent}%
          </span>
        </span>
      </div>
    </Card>
  );
}
