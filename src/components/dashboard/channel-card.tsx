"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { formatKr } from "@/lib/format";
import { TrendingUp, TrendingDown } from "lucide-react";

export function ChannelCard({
  name,
  boxes,
  revenue,
  trend,
  avg30dRevenue,
  lastYearRevenue,
  color,
  logo,
  isExpanded,
  onClick,
  children,
}: {
  name: string;
  boxes: number;
  revenue: number;
  trend: number;
  avg30dRevenue: number;
  lastYearRevenue: number | null;
  color: string;
  logo?: string;
  isExpanded: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  const isPositive = trend >= 0;

  return (
    <div
      className={cn(
        "animate-fade-in rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition-all duration-200 ease-out overflow-hidden",
        isExpanded && "ring-1 ring-primary-border"
      )}
    >
      <button
        onClick={onClick}
        className="group relative w-full p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
      >
        {/* Header: logo + name */}
        <div className="mb-4 flex items-center gap-3">
          {logo && (
            <Image
              src={logo}
              alt={name}
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
            />
          )}
          {!logo && (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {name.charAt(0)}
            </div>
          )}
          <span className="text-sm font-semibold text-foreground">{name}</span>
        </div>

        {/* Center: big box count */}
        <div className="mb-4">
          <p className="text-3xl font-bold text-foreground">{boxes}</p>
          <p className="text-xs text-text-dim">kassar</p>
        </div>

        {/* Bottom: revenue + trend */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary">{formatKr(revenue)}</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              isPositive
                ? "bg-primary-light text-primary"
                : "bg-danger-light text-danger"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? "+" : ""}{trend}%
          </span>
        </div>

        {/* 30d average */}
        <p className="mt-2 text-xs text-text-dim">
          30d meðalt. {formatKr(avg30dRevenue)}
        </p>

        {/* Last year comparison */}
        {lastYearRevenue != null && lastYearRevenue > 0 && (() => {
          const yoyPct = Math.round(((revenue - lastYearRevenue) / lastYearRevenue) * 100);
          const positive = yoyPct >= 0;
          return (
            <p className="mt-1 text-xs text-text-dim">
              Í fyrra: {formatKr(lastYearRevenue)}{" "}
              <span className={cn("font-medium", positive ? "text-primary" : "text-danger")}>
                ({positive ? "+" : ""}{yoyPct}%)
              </span>
            </p>
          );
        })()}
      </button>

      {isExpanded && children && (
        <div className="border-t border-border-light">{children}</div>
      )}
    </div>
  );
}
