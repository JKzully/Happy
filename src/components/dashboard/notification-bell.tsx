"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DeadStore } from "@/lib/data/mock-sales";

const typeColors = {
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-info",
  success: "bg-primary",
};

interface Alert {
  type: keyof typeof typeColors;
  message: string;
}

export function NotificationBell({
  alerts,
  deadStores,
}: {
  alerts: Alert[];
  deadStores: DeadStore[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const deadStoreAlerts: Alert[] = deadStores
    .filter((s) => s.daysSinceSale >= 7)
    .map((s) => ({
      type: s.daysSinceSale >= 10 ? "danger" as const : "warning" as const,
      message: `${s.storeName}: Engin sala í ${s.daysSinceSale} daga`,
    }));

  const allItems = [...alerts, ...deadStoreAlerts];
  // Deduplicate by message
  const seen = new Set<string>();
  const uniqueItems = allItems.filter((item) => {
    if (seen.has(item.message)) return false;
    seen.add(item.message);
    return true;
  });

  const count = uniqueItems.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface transition-colors hover:bg-surface-elevated"
      >
        <Bell className="h-4 w-4 text-text-secondary" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 animate-fade-in rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]">
          <div className="border-b border-border-light px-4 py-3">
            <p className="text-xs font-semibold text-foreground">Tilkynningar</p>
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {uniqueItems.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-text-dim">Engar tilkynningar</p>
            ) : (
              uniqueItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-elevated/60"
                >
                  <div className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", typeColors[item.type])} />
                  <p className="text-xs text-text-secondary leading-relaxed">{item.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
