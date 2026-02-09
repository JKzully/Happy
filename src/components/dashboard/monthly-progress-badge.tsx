"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { MonthlyProgress } from "./monthly-progress";
import { cn } from "@/lib/cn";

export function MonthlyProgressBadge({
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
  const [open, setOpen] = useState(false);
  const pct = Math.round((daysElapsed / daysTotal) * 100);
  const shortMonth = month.split(" ")[0]?.slice(0, 3) ?? month;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs transition-colors hover:bg-surface-elevated"
      >
        <span className="font-medium text-text-secondary">{shortMonth}:</span>
        <span className="font-bold text-foreground">{pct}%</span>
        <div className="h-1.5 w-10 overflow-hidden rounded-full bg-surface-elevated">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              projected >= 0 ? "bg-primary" : "bg-danger"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </button>

      {/* Slide-over panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-0 top-0 z-[70] h-full w-full max-w-md animate-fade-in overflow-y-auto border-l border-border bg-background p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Mánaðaryfirlit</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-dim transition-colors hover:bg-surface-elevated hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <MonthlyProgress
              month={month}
              daysElapsed={daysElapsed}
              daysTotal={daysTotal}
              revenueSoFar={revenueSoFar}
              productionCosts={productionCosts}
              adSpend={adSpend}
              fixedCosts={fixedCosts}
              projected={projected}
              breakEvenDaily={breakEvenDaily}
            />
          </div>
        </>
      )}
    </>
  );
}
