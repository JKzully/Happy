import { Card } from "@/components/ui/card";
import { formatKr } from "@/lib/format";

export function BenchmarkBar({
  avgRevenue,
  avgAdSpend,
  avgBoxes,
}: {
  avgRevenue: number;
  avgAdSpend: number;
  avgBoxes: number;
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
    </Card>
  );
}
