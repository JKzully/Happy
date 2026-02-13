"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKr } from "@/lib/format";
import { Lock, LockOpen, Plus, X, Loader2 } from "lucide-react";
import { useCostBudget } from "@/hooks/use-cost-budget";
import { MonthSelector } from "@/components/cost/month-selector";
import { BudgetSummaryBar } from "@/components/cost/budget-summary-bar";
import { CostCategoryCard } from "@/components/cost/cost-category-card";
import { createClient } from "@/lib/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "#3B82F6", "#22C55E", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Maí", "Jún", "Júl", "Ágú", "Sep", "Okt", "Nóv", "Des"];

function getDefaultMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CostTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#18181B] px-4 py-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-[#A1A1AA]">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-6 py-0.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[11px] text-[#D4D4D8]">{entry.name}</span>
          </div>
          <span className="text-[11px] font-medium text-[#FAFAFA]">{formatKr(entry.value)}</span>
        </div>
      ))}
      <div className="mt-2 border-t border-[rgba(255,255,255,0.07)] pt-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#A1A1AA]">Samtals</span>
        <span className="text-[11px] font-bold text-[#FAFAFA]">{formatKr(total)}</span>
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface ChartCategory {
  dataKey: string;
  name: string;
  color: string;
}

function ActualCostChart({
  month,
  categories: costCategories,
  colorMap,
}: {
  month: string;
  categories: { id: string; name: string; entries: { actualAmount: number; vskPercent: number }[] }[];
  colorMap: Record<string, string>;
}) {
  const [chartData, setChartData] = useState<Record<string, unknown>[]>([]);
  const [areaCats, setAreaCats] = useState<ChartCategory[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Build chart when cost categories change
  const buildChart = useCallback(async () => {
    if (costCategories.length === 0) return;

    const [y, m] = month.split("-").map(Number);
    const supabase = createClient();

    // Get 6 months of monthly_cost_entries
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const { data: allEntries } = await supabase
      .from("monthly_cost_entries")
      .select("cost_item_id, month, actual_amount")
      .in("month", months) as unknown as { data: { cost_item_id: string; month: string; actual_amount: number }[] | null };

    const { data: allItems } = await supabase
      .from("cost_items")
      .select("id, category_id, vsk_percent") as unknown as { data: { id: string; category_id: string; vsk_percent: number }[] | null };

    // Build item→category map
    const itemCatMap = new Map((allItems ?? []).map(i => [i.id, { catId: i.category_id, vsk: i.vsk_percent }]));

    // Build area categories using stable color map
    const areas: ChartCategory[] = costCategories.map((cat) => ({
      dataKey: `cat_${cat.id.slice(0, 8)}`,
      name: cat.name,
      color: colorMap[cat.id] || CHART_COLORS[0],
    }));

    // Build monthly totals per category
    const data = months.map((mk) => {
      const d = new Date(parseInt(mk.split("-")[0]), parseInt(mk.split("-")[1]) - 1, 1);
      const row: Record<string, unknown> = { month: MONTH_LABELS[d.getMonth()] };

      // Per-category actual totals
      for (const cat of costCategories) {
        let catTotal = 0;
        for (const entry of (allEntries ?? [])) {
          if (entry.month !== mk) continue;
          const info = itemCatMap.get(entry.cost_item_id);
          if (info && info.catId === cat.id) {
            catTotal += entry.actual_amount * (1 + info.vsk / 100);
          }
        }
        row[`cat_${cat.id.slice(0, 8)}`] = Math.round(catTotal);
      }

      return row;
    });

    // Sort areas: largest current-month total at bottom (first in array)
    const currentMk = months[months.length - 1];
    const currentData = data.find(d => {
      const cd = new Date(parseInt(currentMk.split("-")[0]), parseInt(currentMk.split("-")[1]) - 1, 1);
      return d.month === MONTH_LABELS[cd.getMonth()];
    }) || data[data.length - 1];

    areas.sort((a, b) => {
      const aVal = (currentData[a.dataKey] as number) ?? 0;
      const bVal = (currentData[b.dataKey] as number) ?? 0;
      return bVal - aVal; // largest first = bottom of stack
    });

    setChartData(data);
    setAreaCats(areas);
    setLoaded(true);
  }, [month, costCategories, colorMap]);

  // Load chart on mount / when deps change
  useEffect(() => { buildChart(); }, [buildChart]);

  if (!loaded || chartData.length === 0) return null;

  const currentMonth = chartData[chartData.length - 1];
  const totalMonthly = areaCats.reduce(
    (sum, cat) => sum + ((currentMonth[cat.dataKey] as number) ?? 0),
    0
  );

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
              Raunkostnaður — 6 mánuðir
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {formatKr(totalMonthly)}
            </p>
          </div>
          <Badge variant="neutral">6 mánuðir</Badge>
        </div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                {areaCats.map((cat) => (
                  <linearGradient key={cat.dataKey} id={`grad-${cat.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={cat.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={cat.color} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
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
                tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`}
                width={45}
              />
              <Tooltip content={<CostTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "#A1A1AA" }}
              />
              {areaCats.map((cat) => (
                <Area
                  key={cat.dataKey}
                  type="monotone"
                  dataKey={cat.dataKey}
                  name={cat.name}
                  stackId="1"
                  stroke={cat.color}
                  strokeWidth={2}
                  fill={`url(#grad-${cat.dataKey})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}


/* eslint-disable @typescript-eslint/no-explicit-any */
function BreakdownPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#18181B] px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.payload.fill }} />
        <span className="text-[11px] text-[#D4D4D8]">{d.name}</span>
      </div>
      <p className="mt-0.5 text-[11px] font-medium text-[#FAFAFA]">
        {formatKr(d.value)} ({d.payload.pct}%)
      </p>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function CostBreakdownPie({
  categories,
  colorMap,
}: {
  categories: { id: string; name: string; entries: { actualAmount: number; vskPercent: number }[] }[];
  colorMap: Record<string, string>;
}) {
  const pieData = categories
    .map((cat) => ({
      name: cat.name,
      value: cat.entries.reduce((s, e) => s + e.actualAmount * (1 + e.vskPercent / 100), 0),
      color: colorMap[cat.id] || CHART_COLORS[0],
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = pieData.reduce((s, d) => s + d.value, 0);
  const withPct = pieData.map((d) => ({
    ...d,
    pct: total > 0 ? Math.round((d.value / total) * 100) : 0,
  }));

  if (withPct.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim mb-4">
          Skipting kostnaðar eftir flokkum
        </p>
        <div className="flex items-center gap-6">
          <div className="h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={withPct}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {withPct.map((d, idx) => (
                    <Cell key={idx} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<BreakdownPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2">
            {withPct.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-xs text-text-secondary w-44 truncate">{d.name}</span>
                <span className="text-xs font-medium text-foreground">{formatKr(d.value)}</span>
                <span className="text-[10px] text-text-dim">({d.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CostPage() {
  const [month, setMonth] = useState(getDefaultMonth);
  const budget = useCostBudget(month);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Stable color map: categoryId → color
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    budget.categories.forEach((cat, i) => {
      map[cat.id] = CHART_COLORS[i % CHART_COLORS.length];
    });
    return map;
  }, [budget.categories]);

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    await budget.addCategory(name);
    setNewCategoryName("");
    setAddingCategory(false);
  };

  if (budget.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-text-dim" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Kostnaður" subtitle="Áætlun vs raun — mánaðarlegur kostnaður">
        <MonthSelector month={month} onChange={setMonth} isLocked={budget.isLocked} />
        {budget.isLocked ? (
          <Button variant="outline" size="sm" onClick={budget.unlockMonth}>
            <LockOpen className="h-4 w-4" />
            Opna mánuð
          </Button>
        ) : (
          <Button size="sm" onClick={budget.lockMonth}>
            <Lock className="h-4 w-4" />
            Staðfesta mánuð
          </Button>
        )}
      </PageHeader>

      <BudgetSummaryBar categories={budget.categories} />

      <div className="grid grid-cols-2 gap-6">
        <CostBreakdownPie categories={budget.categories} colorMap={colorMap} />
        <ActualCostChart month={month} categories={budget.categories} colorMap={colorMap} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {budget.categories.map((cat) => (
          <CostCategoryCard
            key={cat.id}
            category={cat}
            isLocked={budget.isLocked}
            chartColor={colorMap[cat.id]}
            showPieChart={false}
            isApiSourced={cat.name.toLowerCase().includes("auglýsing")}
            onConfirmEntry={budget.confirmEntry}
            onSaveEntries={budget.saveEntries}
            onAddItem={budget.addCostItem}
            onDeleteItem={budget.deleteCostItem}
            onDeleteCategory={budget.deleteCategory}
          />
        ))}
      </div>

      {/* Add category */}
      {!budget.isLocked && (
        <div className="flex justify-center">
          {addingCategory ? (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCategory();
                  if (e.key === "Escape") {
                    setAddingCategory(false);
                    setNewCategoryName("");
                  }
                }}
                placeholder="Nafn á nýjum flokki..."
                className="w-64 h-auto py-1.5"
                autoFocus
              />
              <Button size="xs" onClick={handleAddCategory}>
                <Plus className="h-3.5 w-3.5" />
                Bæta við
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setAddingCategory(false);
                  setNewCategoryName("");
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddingCategory(true)}
            >
              <Plus className="h-4 w-4" />
              Bæta við flokk
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
