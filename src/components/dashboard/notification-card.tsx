"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { CheckCircle2 } from "lucide-react";

const typeConfig = {
  danger: { bg: "bg-red-50 dark:bg-red-950/30", dot: "bg-red-500" },
  warning: { bg: "bg-amber-50 dark:bg-amber-950/30", dot: "bg-yellow-500" },
  success: { bg: "bg-emerald-50 dark:bg-emerald-950/30", dot: "bg-emerald-500" },
  info: { bg: "bg-blue-50 dark:bg-blue-950/30", dot: "bg-blue-500" },
};

export interface Alert {
  type: keyof typeof typeConfig;
  message: string;
}

export function NotificationCard({
  alerts,
}: {
  alerts: Alert[];
}) {
  const [showAll, setShowAll] = useState(false);

  const visibleItems = showAll ? alerts : alerts.slice(0, 5);
  const hasMore = alerts.length > 5;
  const dangerCount = alerts.filter((a) => a.type === "danger").length;

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border-light px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">Tilkynningar</h3>
        {alerts.length > 0 ? (
          <span className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
            dangerCount > 0
              ? "bg-danger/10 text-danger"
              : "bg-warning/10 text-warning"
          )}>
            {alerts.length}
          </span>
        ) : (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-text-secondary">
              Allt í lagi — engar viðvaranir
            </p>
          </div>
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
              : `Sýna allt (${alerts.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
