"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatKr } from "@/lib/format";
import type { CostCategoryWithEntries } from "@/hooks/use-cost-budget";

export function BudgetSummaryBar({
  categories,
}: {
  categories: CostCategoryWithEntries[];
}) {
  let totalBudget = 0;
  let totalActual = 0;

  for (const cat of categories) {
    for (const e of cat.entries) {
      totalBudget += e.budgetAmount * (1 + e.vskPercent / 100);
      totalActual += e.actualAmount * (1 + e.vskPercent / 100);
    }
  }

  const diff = totalActual - totalBudget;
  const pct = totalBudget > 0 ? ((diff / totalBudget) * 100) : 0;
  const overBudget = diff > 0;

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
            Áætlun samtals
          </p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {formatKr(totalBudget)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
            Raun samtals
          </p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {formatKr(totalActual)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
            Mismunur
          </p>
          <p className={`mt-1 text-xl font-bold ${overBudget ? "text-danger" : "text-primary"}`}>
            {diff > 0 ? "+" : ""}{formatKr(diff)}
            <span className="ml-1 text-sm font-medium">
              ({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
