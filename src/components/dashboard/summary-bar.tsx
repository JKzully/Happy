"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { formatKr } from "@/lib/format";
import { LayoutGrid, List } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function SummaryBar({
  revenue,
  cogs,
  adSpend,
  fixedCosts,
}: {
  revenue: number;
  cogs: number;
  adSpend: number;
  fixedCosts: number;
}) {
  const [detailed, setDetailed] = useState(false);
  const grossMargin = revenue - cogs;
  const netMargin = grossMargin - adSpend - fixedCosts;
  const grossPct = revenue > 0 ? (grossMargin / revenue) * 100 : 0;
  const netPct = revenue > 0 ? (netMargin / revenue) * 100 : 0;

  return (
    <Card className="relative overflow-hidden">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Toggle */}
      <div className="absolute right-4 top-4 z-10 flex gap-0.5 rounded-lg border border-border bg-surface-elevated/60 p-0.5">
        <button
          onClick={() => setDetailed(false)}
          className={`rounded-md p-1.5 transition-all duration-200 ${
            !detailed
              ? "bg-primary/10 text-primary shadow-sm"
              : "text-text-dim hover:text-text-secondary"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setDetailed(true)}
          className={`rounded-md p-1.5 transition-all duration-200 ${
            detailed
              ? "bg-primary/10 text-primary shadow-sm"
              : "text-text-dim hover:text-text-secondary"
          }`}
        >
          <List className="h-3.5 w-3.5" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!detailed ? (
          <motion.div
            key="simple"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="px-8 py-8"
          >
            <SimpleView
              revenue={revenue}
              grossMargin={grossMargin}
              grossPct={grossPct}
              netMargin={netMargin}
              netPct={netPct}
            />
          </motion.div>
        ) : (
          <motion.div
            key="detailed"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="px-8 pb-6 pt-8"
          >
            <DetailedView
              revenue={revenue}
              cogs={cogs}
              adSpend={adSpend}
              fixedCosts={fixedCosts}
              grossMargin={grossMargin}
              grossPct={grossPct}
              netMargin={netMargin}
              netPct={netPct}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/* ── Simple: 3 metric blocks ────────────────────────────── */

function SimpleView({
  revenue,
  grossMargin,
  grossPct,
  netMargin,
  netPct,
}: {
  revenue: number;
  grossMargin: number;
  grossPct: number;
  netMargin: number;
  netPct: number;
}) {
  return (
    <div className="grid grid-cols-3 items-center">
      {/* Revenue */}
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
          Heildartekjur
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-foreground">
          {formatKr(revenue)}
        </p>
      </div>

      {/* Gross Margin */}
      <div className="relative text-center">
        <div className="absolute inset-y-0 left-0 w-px bg-border-light" />
        <div className="absolute inset-y-0 right-0 w-px bg-border-light" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
          Brúttóframlegð
        </p>
        <p
          className={`mt-2 text-3xl font-bold tracking-tight ${
            grossMargin >= 0 ? "text-primary" : "text-danger"
          }`}
        >
          {grossPct.toFixed(1)}%
        </p>
        <p className="mt-0.5 text-sm tabular-nums text-text-secondary">
          {formatKr(grossMargin)}
        </p>
      </div>

      {/* Net Margin */}
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
          Hrein framlegð
        </p>
        <p
          className={`mt-2 text-3xl font-bold tabular-nums tracking-tight ${
            netMargin >= 0 ? "text-primary" : "text-danger"
          }`}
        >
          {formatKr(netMargin)}
        </p>
        <p
          className={`mt-0.5 text-sm font-medium ${
            netMargin >= 0 ? "text-primary/60" : "text-danger/60"
          }`}
        >
          {netPct.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

/* ── Detailed: Waterfall breakdown ──────────────────────── */

function DetailedView({
  revenue,
  cogs,
  adSpend,
  fixedCosts,
  grossMargin,
  grossPct,
  netMargin,
  netPct,
}: {
  revenue: number;
  cogs: number;
  adSpend: number;
  fixedCosts: number;
  grossMargin: number;
  grossPct: number;
  netMargin: number;
  netPct: number;
}) {
  const maxVal = revenue || 1;

  const rows: WaterfallRowProps[] = [
    {
      label: "Heildartekjur",
      amount: revenue,
      barWidth: 100,
      barColor: "bg-foreground/[0.06]",
      variant: "hero",
      delay: 0,
    },
    {
      label: "Vörukostnaður",
      amount: -cogs,
      barWidth: (cogs / maxVal) * 100,
      barColor: "bg-danger/[0.08]",
      variant: "deduction",
      delay: 0.04,
    },
    {
      label: "Brúttóframlegð",
      amount: grossMargin,
      pct: grossPct,
      barWidth: (Math.abs(grossMargin) / maxVal) * 100,
      barColor: grossMargin >= 0 ? "bg-primary/[0.06]" : "bg-danger/[0.06]",
      variant: "subtotal",
      positive: grossMargin >= 0,
      delay: 0.08,
    },
    {
      label: "Auglýsingar",
      amount: -adSpend,
      barWidth: (adSpend / maxVal) * 100,
      barColor: "bg-danger/[0.08]",
      variant: "deduction",
      delay: 0.12,
    },
    {
      label: "Fastur kostnaður",
      amount: -fixedCosts,
      barWidth: (fixedCosts / maxVal) * 100,
      barColor: "bg-danger/[0.08]",
      variant: "deduction",
      delay: 0.16,
    },
    {
      label: "Hrein framlegð",
      amount: netMargin,
      pct: netPct,
      barWidth: (Math.abs(netMargin) / maxVal) * 100,
      barColor: netMargin >= 0 ? "bg-primary/[0.08]" : "bg-danger/[0.08]",
      variant: "total",
      positive: netMargin >= 0,
      delay: 0.2,
    },
  ];

  return (
    <div className="space-y-0">
      {rows.map((row) => (
        <WaterfallRow key={row.label} {...row} />
      ))}
    </div>
  );
}

/* ── Waterfall row ──────────────────────────────────────── */

interface WaterfallRowProps {
  label: string;
  amount: number;
  pct?: number;
  barWidth: number;
  barColor: string;
  variant: "hero" | "deduction" | "subtotal" | "total";
  positive?: boolean;
  delay: number;
}

function WaterfallRow({
  label,
  amount,
  pct,
  barWidth,
  barColor,
  variant,
  positive,
  delay,
}: WaterfallRowProps) {
  const isResult = variant === "subtotal" || variant === "total";
  const isDeduction = variant === "deduction";
  const isTotal = variant === "total";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={`relative flex items-center justify-between py-2.5 ${
        isResult ? "mt-0.5" : ""
      }`}
    >
      {/* Proportional background bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.1, ease: "easeOut" }}
        className={`absolute inset-y-0 left-0 origin-left rounded-r ${barColor}`}
        style={{ width: `${Math.min(barWidth, 100)}%` }}
      />

      {/* Top border for subtotals */}
      {isResult && (
        <div className="absolute inset-x-0 top-0 h-px bg-border-light" />
      )}

      {/* Label */}
      <span
        className={`relative z-10 text-sm ${
          isDeduction ? "pl-5 text-text-secondary" : ""
        } ${isResult ? "font-semibold text-foreground" : ""} ${
          variant === "hero" ? "font-medium text-foreground" : ""
        }`}
      >
        {isDeduction && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-text-dim/40">
            −
          </span>
        )}
        {label}
      </span>

      {/* Values */}
      <div className="relative z-10 flex items-baseline gap-3">
        {pct !== undefined && (
          <span
            className={`text-xs font-medium ${
              positive ? "text-primary/60" : "text-danger/60"
            }`}
          >
            {pct.toFixed(1)}%
          </span>
        )}
        <span
          className={`tabular-nums ${
            isTotal
              ? `text-xl font-bold ${positive ? "text-primary" : "text-danger"}`
              : variant === "subtotal"
                ? `text-base font-semibold ${positive ? "text-primary" : "text-danger"}`
                : isDeduction
                  ? "text-base text-danger/70"
                  : "text-base font-semibold text-foreground"
          }`}
        >
          {isDeduction
            ? `−${formatKr(Math.abs(amount))}`
            : formatKr(amount)}
        </span>
      </div>
    </motion.div>
  );
}
