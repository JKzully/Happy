"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { DeadStore } from "@/lib/data/mock-sales";

const typeConfig = {
  danger: { bg: "bg-red-50 dark:bg-red-950/30", dot: "bg-red-500" },
  warning: { bg: "bg-amber-50 dark:bg-amber-950/30", dot: "bg-yellow-500" },
  success: { bg: "bg-emerald-50 dark:bg-emerald-950/30", dot: "bg-emerald-500" },
  info: { bg: "bg-blue-50 dark:bg-blue-950/30", dot: "bg-blue-500" },
};

interface Alert {
  type: keyof typeof typeConfig;
  message: string;
}

export function NotificationCard({
  alerts,
  deadStores,
}: {
  alerts: Alert[];
  deadStores: DeadStore[];
}) {
  const [showAll, setShowAll] = useState(false);

  const deadStoreAlerts: Alert[] = deadStores
    .filter((s) => s.daysSinceSale >= 7)
    .map((s) => ({
      type: s.daysSinceSale >= 10 ? ("danger" as const) : ("warning" as const),
      message: `${s.storeName}: Engin sala í ${s.daysSinceSale} daga`,
    }));

  const allItems = [...alerts, ...deadStoreAlerts];
  const seen = new Set<string>();
  const uniqueItems = allItems.filter((item) => {
    if (seen.has(item.message)) return false;
    seen.add(item.message);
    return true;
  });

  const visibleItems = showAll ? uniqueItems : uniqueItems.slice(0, 5);
  const hasMore = uniqueItems.length > 5;

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border-light px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">Tilkynningar</h3>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger/10 px-1.5 text-[10px] font-bold text-danger">
          {uniqueItems.length}
        </span>
      </div>

      <div className="space-y-2 p-4">
        {uniqueItems.length === 0 ? (
          <p className="py-4 text-center text-xs text-text-dim">
            Engar tilkynningar
          </p>
        ) : (
          visibleItems.map((item, i) => {
            const config = typeConfig[item.type];
            return (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3.5 py-2.5",
                  config.bg
                )}
              >
                <div
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    config.dot
                  )}
                />
                <p className="text-xs font-medium leading-relaxed text-zinc-700 dark:text-zinc-200">
                  {item.message}
                </p>
              </div>
            );
          })
        )}
      </div>

      {hasMore && (
        <div className="border-t border-border-light px-5 py-2.5">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            {showAll
              ? "Sýna minna"
              : `Sýna allt (${uniqueItems.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
