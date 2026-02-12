import { Card } from "@/components/ui/card";
import { formatKr } from "@/lib/format";
import { Minus, Equal } from "lucide-react";

export function SummaryBar({
  revenue,
  cogs,
  adSpend,
}: {
  revenue: number;
  cogs: number;
  adSpend: number;
}) {
  const margin = revenue - cogs - adSpend;

  return (
    <Card className="relative overflow-hidden">
      {/* Subtle gradient accent at top */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="flex items-center justify-center gap-6 px-8 py-6">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
            Heildartekjur
          </p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">
            {formatKr(revenue)}
          </p>
        </div>
        <Minus className="h-5 w-5 shrink-0 text-text-dim/50" />
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
            Vörukostnaður
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-danger">
            {formatKr(cogs)}
          </p>
        </div>
        <Minus className="h-5 w-5 shrink-0 text-text-dim/50" />
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
            Auglýsingar
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-danger">
            {formatKr(adSpend)}
          </p>
        </div>
        <Equal className="h-5 w-5 shrink-0 text-text-dim/50" />
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
            Framlegð
          </p>
          <p className={`mt-1.5 text-3xl font-bold tracking-tight ${margin >= 0 ? "text-primary" : "text-danger"}`}>
            {formatKr(margin)}
          </p>
        </div>
      </div>
    </Card>
  );
}
