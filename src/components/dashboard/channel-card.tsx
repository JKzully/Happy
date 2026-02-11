"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatKr } from "@/lib/format";
import { Upload } from "lucide-react";

function formatDateLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Í dag";
  if (diffDays === 1) return "Í gær";
  const d = date.getDate();
  const months = ["jan", "feb", "mar", "apr", "maí", "jún", "júl", "ágú", "sep", "okt", "nóv", "des"];
  return `${d}. ${months[date.getMonth()]}`;
}

export function ChannelCard({
  name,
  boxes,
  revenue,
  avg30dRevenue,
  lastDataDate,
  hasData = true,
  shopifyTodayBoxes,
  color,
  logo,
  isExpanded,
  onClick,
  children,
}: {
  name: string;
  boxes: number;
  revenue: number;
  avg30dRevenue: number;
  lastDataDate: string | null;
  hasData?: boolean;
  shopifyTodayBoxes?: number | null;
  color: string;
  logo?: string;
  isExpanded: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "animate-fade-in rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition-all duration-200 ease-out overflow-hidden",
        isExpanded && "ring-1 ring-primary-border"
      )}
    >
      <button
        onClick={onClick}
        className="group relative w-full p-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
      >
        {/* Header: logo + name */}
        <div className="mb-4 flex items-center justify-center gap-3">
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

        {!hasData ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm font-medium text-text-dim">Engin gögn</p>
            <Link
              href="/input"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Upload className="h-3 w-3" />
              Hladdu upp Excel söluskýrslu
            </Link>
          </div>
        ) : (
          <>
            {/* Main number: revenue */}
            <p className="text-3xl font-bold text-foreground">{formatKr(revenue)}</p>
            <p className="mt-1 text-sm text-text-dim">{boxes} kassar</p>

            {/* Shopify today supplement */}
            {shopifyTodayBoxes != null && shopifyTodayBoxes > 0 && (
              <p className="mt-2 text-xs font-medium text-primary">
                Í dag: {shopifyTodayBoxes} kassar
              </p>
            )}

            {/* 30d average */}
            <p className="mt-3 text-xs text-text-dim">
              30d meðalt. {formatKr(avg30dRevenue)}
            </p>

            {/* Last data indicator */}
            {lastDataDate && (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const date = new Date(lastDataDate + "T00:00:00");
              const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);
              const isUpToDate = diffDays <= 1;
              return (
                <p className={cn(
                  "mt-2 text-xs font-medium",
                  isUpToDate ? "text-primary" : "text-warning"
                )}>
                  {isUpToDate ? "Uppfært í dag" : `Uppfært: ${formatDateLabel(lastDataDate)}`}
                </p>
              );
            })()}
          </>
        )}
      </button>

      {isExpanded && children && (
        <div className="border-t border-border-light">{children}</div>
      )}
    </div>
  );
}
