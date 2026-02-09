import { Card } from "@/components/ui/card";
import { formatKr } from "@/lib/format";
import { Minus, Equal } from "lucide-react";

export function SummaryBar({
  revenue,
  adSpend,
  margin,
  lastYearRevenue,
}: {
  revenue: number;
  adSpend: number;
  margin: number;
  lastYearRevenue: number | null;
}) {
  const yoyPercent =
    lastYearRevenue != null && lastYearRevenue > 0
      ? Math.round(((revenue - lastYearRevenue) / lastYearRevenue) * 100)
      : null;
  const yoyPositive = yoyPercent != null && yoyPercent >= 0;
  return (
    <Card className="relative overflow-hidden">
      {/* Subtle gradient accent at top */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="flex items-center justify-center gap-8 px-8 py-6">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
            Heildartekjur
          </p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">
            {formatKr(revenue)}
          </p>
          {yoyPercent != null && (
            <p
              className={`mt-1 text-xs font-medium ${
                yoyPositive ? "text-primary" : "text-danger"
              }`}
            >
              {yoyPositive ? "↑" : "↓"} {yoyPositive ? "+" : ""}
              {yoyPercent}% vs í fyrra
            </p>
          )}
        </div>
        <Minus className="h-5 w-5 text-text-dim/50" />
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
            Auglýsingar
          </p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-danger">
            {formatKr(adSpend)}
          </p>
        </div>
        <Equal className="h-5 w-5 text-text-dim/50" />
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
            Framlegð
          </p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-primary">
            {formatKr(margin)}
          </p>
        </div>
      </div>
    </Card>
  );
}
