import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatKr } from "@/lib/format";
import { cn } from "@/lib/cn";

export function MonthlyProgress({
  month,
  daysElapsed,
  daysTotal,
  revenueSoFar,
  productionCosts,
  adSpend,
  fixedCosts,
  projected,
  breakEvenDaily,
}: {
  month: string;
  daysElapsed: number;
  daysTotal: number;
  revenueSoFar: number;
  productionCosts: number;
  adSpend: number;
  fixedCosts: number;
  projected: number;
  breakEvenDaily: number;
}) {
  const pct = Math.round((daysElapsed / daysTotal) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{month}</h3>
          <span className="text-xs text-text-dim">
            Dagur {daysElapsed} af {daysTotal}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-text-dim">
            <span>{pct}% af mánuði</span>
            <span>
              {daysElapsed}/{daysTotal} dagar
            </span>
          </div>
          <Progress value={pct} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-surface-elevated/60 p-3 ring-1 ring-border">
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-dim">Tekjur</p>
            <p className="mt-0.5 text-sm font-bold text-foreground">
              {formatKr(revenueSoFar)}
            </p>
          </div>
          <div className="rounded-lg bg-surface-elevated/60 p-3 ring-1 ring-border">
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-dim">Framleiðslukostnaður</p>
            <p className="mt-0.5 text-sm font-bold text-foreground">
              {formatKr(productionCosts)}
            </p>
          </div>
          <div className="rounded-lg bg-surface-elevated/60 p-3 ring-1 ring-border">
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-dim">Meta + Google</p>
            <p className="mt-0.5 text-sm font-bold text-foreground">
              {formatKr(adSpend)}
            </p>
          </div>
          <div className="rounded-lg bg-surface-elevated/60 p-3 ring-1 ring-border">
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-dim">Fastur kostnaður</p>
            <p className="mt-0.5 text-sm font-bold text-foreground">
              {formatKr(fixedCosts)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-dim">Áætluð niðurstaða</p>
            <p
              className={cn(
                "mt-0.5 text-lg font-bold",
                projected >= 0 ? "text-primary" : "text-danger"
              )}
            >
              {formatKr(projected)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-dim">Break-even/dag</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {formatKr(breakEvenDaily)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
