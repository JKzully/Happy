"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { CheckCircle2, ChevronDown } from "lucide-react";

const typeConfig = {
  danger: { bg: "bg-red-50 dark:bg-red-950/30", dot: "bg-red-500" },
  warning: { bg: "bg-amber-50 dark:bg-amber-950/30", dot: "bg-yellow-500" },
  success: { bg: "bg-emerald-50 dark:bg-emerald-950/30", dot: "bg-emerald-500" },
  info: { bg: "bg-blue-50 dark:bg-blue-950/30", dot: "bg-blue-500" },
};

export interface Alert {
  type: keyof typeof typeConfig;
  message: string;
  details?: string[];
}

function AlertItem({ item }: { item: Alert }) {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig[item.type];
  const hasDetails = item.details && item.details.length > 0;

  return (
    <div
      className={cn(
        "rounded-xl px-3.5 py-2.5",
        config.bg
      )}
    >
      <div
        className={cn(
          "flex items-start gap-3",
          hasDetails && "cursor-pointer"
        )}
        onClick={hasDetails ? () => setExpanded(!expanded) : undefined}
      >
        <div
          className={cn(
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            config.dot
          )}
        />
        <p className="flex-1 text-xs font-medium leading-relaxed text-zinc-700 dark:text-zinc-200">
          {item.message}
        </p>
        {hasDetails && (
          <ChevronDown
            className={cn(
              "mt-0.5 h-3.5 w-3.5 shrink-0 text-text-dim transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        )}
      </div>
      {hasDetails && expanded && (
        <div className="mt-2 ml-5 space-y-0.5">
          {item.details!.map((detail, j) => (
            <p key={j} className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {detail}
            </p>
          ))}
        </div>
      )}
    </div>
  );
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
          visibleItems.map((item, i) => (
            <AlertItem key={i} item={item} />
          ))
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
