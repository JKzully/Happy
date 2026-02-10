"use client";

import { useState } from "react";
import { subDays } from "date-fns";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { formatKr } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { useCompareSales } from "@/hooks/use-compare-sales";
import { chains } from "@/lib/data/chains";
import type { DateRange } from "@/lib/date-ranges";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function ChangeBadge({ current, previous }: { current: number; previous: number }) {
  const pct = pctChange(current, previous);
  if (pct == null) return null;
  const positive = pct >= 0;
  return (
    <Badge variant={positive ? "success" : "danger"} className="tabular-nums">
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}{pct}%
    </Badge>
  );
}

function chainLabel(chainId: string): string {
  if (chainId === "n1") return "Aðrir / N1";
  return chains.find((c) => c.id === chainId)?.name ?? chainId;
}

export function CompareView() {
  const yesterday = subDays(new Date(), 1);
  const thirtyDaysAgo = subDays(new Date(), 30);

  const [range, setRange] = useState<DateRange>({
    from: fmt(thirtyDaysAgo),
    to: fmt(yesterday),
  });

  const {
    isLoading,
    chains: compareChains,
    totalCurrentRevenue,
    totalCurrentBoxes,
    totalLastYearRevenue,
    totalLastYearBoxes,
  } = useCompareSales(range);

  const thisYear = new Date().getFullYear();
  const lastYear = thisYear - 1;

  return (
    <div className="space-y-6">
      {/* Date range picker bar */}
      <Card>
        <CardContent className="py-4">
          <DateRangePicker value={range} onChange={setRange} />
        </CardContent>
      </Card>

      <div
        className={`transition-opacity duration-300 space-y-6 ${
          isLoading ? "opacity-60" : "opacity-100"
        }`}
      >
        {/* Summary card */}
        <Card>
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <CardContent className="py-6">
            <div className="grid grid-cols-3 gap-8">
              {/* This year totals */}
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
                  {thisYear}
                </p>
                <p className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">
                  {formatKr(totalCurrentRevenue)}
                </p>
                <p className="mt-1 text-sm text-text-dim">
                  {totalCurrentBoxes.toLocaleString("is-IS")} kassar
                </p>
              </div>

              {/* Last year totals */}
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
                  {lastYear}
                </p>
                <p className="mt-1.5 text-3xl font-bold tracking-tight text-text-dim">
                  {formatKr(totalLastYearRevenue)}
                </p>
                <p className="mt-1 text-sm text-text-dim">
                  {totalLastYearBoxes.toLocaleString("is-IS")} kassar
                </p>
              </div>

              {/* % change */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
                  Breyting
                </p>
                <div className="mt-2">
                  <ChangeBadge current={totalCurrentRevenue} previous={totalLastYearRevenue} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per-chain rows */}
        <Card>
          <CardHeader>
            <CardTitle>Samanburður eftir keðju</CardTitle>
          </CardHeader>
          <div className="divide-y divide-border-light">
            {compareChains.map((ch) => {
              const chain = chains.find((c) => c.id === ch.chainId);
              if (!chain) return null;

              return (
                <div key={ch.chainId} className="flex items-center gap-4 px-5 py-4">
                  {/* Logo + name */}
                  <div className="flex w-40 shrink-0 items-center gap-3">
                    {chain.logo ? (
                      <Image
                        src={chain.logo}
                        alt={chain.name}
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-lg object-contain"
                      />
                    ) : (
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                        style={{ backgroundColor: chain.color }}
                      >
                        {chain.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-foreground">
                      {chainLabel(ch.chainId)}
                    </span>
                  </div>

                  {/* This year */}
                  <div className="flex-1 text-center">
                    {ch.hasCurrentData ? (
                      <>
                        <p className="text-sm font-bold text-foreground">
                          {ch.currentBoxes.toLocaleString("is-IS")} kassar
                        </p>
                        <p className="text-xs text-text-dim">{formatKr(ch.currentRevenue)}</p>
                      </>
                    ) : (
                      <p className="text-sm text-text-dim">Gögn ekki enn til</p>
                    )}
                  </div>

                  {/* Separator */}
                  <Minus className="h-4 w-4 shrink-0 text-text-dim/30" />

                  {/* Last year */}
                  <div className="flex-1 text-center">
                    {ch.lastYearRevenue > 0 ? (
                      <>
                        <p className="text-sm font-medium text-text-dim">
                          {ch.lastYearBoxes.toLocaleString("is-IS")} kassar
                        </p>
                        <p className="text-xs text-text-dim">{formatKr(ch.lastYearRevenue)}</p>
                      </>
                    ) : (
                      <p className="text-sm text-text-dim">—</p>
                    )}
                  </div>

                  {/* % change badge */}
                  <div className="w-24 shrink-0 text-right">
                    {ch.hasCurrentData && ch.lastYearRevenue > 0 ? (
                      <ChangeBadge current={ch.currentRevenue} previous={ch.lastYearRevenue} />
                    ) : null}
                  </div>
                </div>
              );
            })}

            {compareChains.length === 0 && !isLoading && (
              <div className="px-5 py-8 text-center text-sm text-text-dim">
                Engin gögn fundust fyrir valið tímabil
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
