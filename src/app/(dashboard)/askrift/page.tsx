"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatKr } from "@/lib/format";
import { Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface KPIs {
  activeSubscribers: number;
  newThisMonth: number;
  cancelledThisMonth: number;
  churnRate: number;
  mrr: number;
}

interface ProductRow {
  productName: string;
  active: number;
  newThisMonth: number;
  cancelledThisMonth: number;
  revenue: number;
}

interface MonthlyRow {
  month: string;
  active: number;
  mrr: number;
  churnRate: number;
}

interface SubscriptionData {
  kpis: KPIs;
  products: ProductRow[];
  monthlyData: MonthlyRow[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function MrrTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#18181B] px-4 py-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-[#A1A1AA]">{label}</p>
      {payload.map((entry: any) => (
        <div
          key={entry.dataKey}
          className="flex items-center justify-between gap-6 py-0.5"
        >
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[11px] text-[#D4D4D8]">{entry.name}</span>
          </div>
          <span className="text-[11px] font-medium text-[#FAFAFA]">
            {entry.dataKey === "mrr"
              ? formatKr(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function AskriftPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/repeat/subscriptions");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Villa við að sækja gögn");
          return;
        }
        setData(json);
      } catch {
        setError("Náði ekki sambandi við Repeat API");
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Áskrift"
          subtitle="Yfirsýn yfir áskriftir frá Repeat.is"
        />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-danger">{error}</p>
            <p className="mt-2 text-xs text-text-dim">
              Athugaðu REPEAT_API_KEY í .env.local
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Áskrift"
          subtitle="Yfirsýn yfir áskriftir frá Repeat.is"
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-dim" />
          <span className="ml-3 text-sm text-text-dim">
            Sæki áskriftagögn...
          </span>
        </div>
      </div>
    );
  }

  const { kpis, products, monthlyData } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Áskrift"
        subtitle="Yfirsýn yfir áskriftir frá Repeat.is"
      />

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          label="Virkir áskrifendur"
          value={String(kpis.activeSubscribers)}
        />
        <StatCard
          label="Nýir (mánuður)"
          value={String(kpis.newThisMonth)}
          trend={
            kpis.activeSubscribers > 0
              ? Math.round(
                  (kpis.newThisMonth / kpis.activeSubscribers) * 100,
                )
              : undefined
          }
          trendLabel="af virkum"
        />
        <StatCard
          label="Uppsagnir"
          value={String(kpis.cancelledThisMonth)}
          trend={kpis.churnRate > 0 ? -kpis.churnRate : undefined}
          trendLabel="churn"
        />
        <StatCard label="MRR" value={formatKr(kpis.mrr)} />
      </div>

      {/* MRR chart */}
      {monthlyData.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
                  MRR þróun — 6 mánuðir
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {formatKr(kpis.mrr)}
                </p>
              </div>
              <Badge variant="neutral">6 mánuðir</Badge>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient
                      id="grad-mrr"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#34D399"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="#34D399"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    opacity={0.1}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#71717A" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#71717A" }}
                    tickFormatter={(v: number) =>
                      v >= 1_000_000
                        ? `${(v / 1_000_000).toFixed(1)}M`
                        : `${Math.round(v / 1000)}k`
                    }
                    width={50}
                  />
                  <Tooltip content={<MrrTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    name="MRR"
                    stroke="#34D399"
                    strokeWidth={2}
                    fill="url(#grad-mrr)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product breakdown table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-elevated/50">
              <TableHead>Vara</TableHead>
              <TableHead className="text-right">Virkir</TableHead>
              <TableHead className="text-right">Nýir</TableHead>
              <TableHead className="text-right">Uppsagnir</TableHead>
              <TableHead className="text-right">Tekjur (MRR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.productName}>
                <TableCell className="font-semibold text-foreground">
                  {p.productName}
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {p.active}
                </TableCell>
                <TableCell className="text-right">
                  {p.newThisMonth > 0 ? (
                    <span className="font-semibold text-primary">
                      +{p.newThisMonth}
                    </span>
                  ) : (
                    <span className="text-text-dim">0</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {p.cancelledThisMonth > 0 ? (
                    <span className="font-semibold text-danger">
                      -{p.cancelledThisMonth}
                    </span>
                  ) : (
                    <span className="text-text-dim">0</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {formatKr(p.revenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
