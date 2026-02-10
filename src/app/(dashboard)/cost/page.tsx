"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKr } from "@/lib/format";
import { costHistory } from "@/lib/data/mock-costs";
import { Pencil, Save, Plus, X, Wifi, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Database, CostCategory as DbCostCategory } from "@/lib/database.types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

type FixedCostRow = Database["public"]["Tables"]["fixed_costs"]["Row"];
type AdSpendRow = Database["public"]["Tables"]["daily_ad_spend"]["Row"];

interface CostItem {
  dbId?: string; // UUID from Supabase, undefined if new
  name: string;
  amount: number;
}

interface CostCategoryData {
  id: string;
  dbCategory: DbCostCategory | null; // null for ads-daily
  title: string;
  editable: boolean;
  items: CostItem[];
}

const CATEGORY_CONFIG: {
  id: string;
  dbCategory: DbCostCategory | null;
  title: string;
  editable: boolean;
}[] = [
  { id: "operations", dbCategory: "operations", title: "Rekstur (mánaðarlegur)", editable: true },
  { id: "marketing-fixed", dbCategory: "marketing_fixed", title: "Markaðssetning - fast", editable: true },
  { id: "marketing-variable", dbCategory: "marketing_variable", title: "Markaðssetning - breytilegur", editable: true },
  { id: "ads-daily", dbCategory: null, title: "Meta + Google (daglegt)", editable: false },
];

const areaCategories = [
  { dataKey: "operations", name: "Rekstur", color: "#3B82F6" },
  { dataKey: "marketingFixed", name: "Markaðss. fast", color: "#22C55E" },
  { dataKey: "marketingVariable", name: "Markaðss. breyt.", color: "#F59E0B" },
  { dataKey: "adsDaily", name: "Meta + Google", color: "#EF4444" },
];

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

function TotalCostChart() {
  const currentMonth = costHistory[costHistory.length - 1];
  const totalMonthly =
    currentMonth.operations +
    currentMonth.marketingFixed +
    currentMonth.marketingVariable +
    currentMonth.adsDaily;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
              Heildarkostnaður — 6 mánuðir
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {formatKr(totalMonthly)}
            </p>
          </div>
          <Badge variant="neutral">6 mánuðir</Badge>
        </div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={costHistory}>
              <defs>
                {areaCategories.map((cat) => (
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
                tickFormatter={(v: number) =>
                  `${(v / 1000000).toFixed(1)}M`
                }
                width={45}
              />
              <Tooltip content={<CostTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "#A1A1AA" }}
              />
              {areaCategories.map((cat) => (
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

function EditableCostCard({
  category,
  onSave,
}: {
  category: CostCategoryData;
  onSave: (catId: string, items: CostItem[]) => Promise<void>;
}) {
  const [items, setItems] = useState<CostItem[]>(category.items);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  // Sync when parent data changes (after load)
  useEffect(() => {
    setItems(category.items);
  }, [category.items]);

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const isApi = !category.editable;

  const handleAmountChange = (index: number, value: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, amount: value } : item))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(category.id, items);
      setEditing(false);
    } catch {
      // toast handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    setItems((prev) => [...prev, { name: newItemName.trim(), amount: 0 }]);
    setNewItemName("");
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{category.title}</h3>
            {isApi && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-light px-2 py-0.5 text-[10px] font-medium text-[#A78BFA] ring-1 ring-[rgba(167,139,250,0.2)]">
                <Wifi className="h-3 w-3" />
                Sjálfvirkt frá API
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              {formatKr(total)}
            </span>
            {category.editable && !editing && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {category.editable && editing && (
              <Button size="xs" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Vista
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border-light">
          {items.map((item, i) => (
            <div
              key={`${item.dbId || item.name}-${i}`}
              className="flex items-center justify-between px-5 py-3 transition-all duration-200 hover:bg-[rgba(255,255,255,0.06)]"
            >
              <span className="text-sm text-text-secondary">{item.name}</span>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={item.amount}
                    onChange={(e) =>
                      handleAmountChange(i, parseInt(e.target.value) || 0)
                    }
                    className="w-32 h-auto py-1 text-right font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleRemoveItem(i)}
                    className="hover:text-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : isApi ? (
                <span className="text-sm font-medium text-text-dim italic">
                  {formatKr(item.amount)}
                </span>
              ) : (
                <span className="text-sm font-medium text-foreground">
                  {formatKr(item.amount)}
                </span>
              )}
            </div>
          ))}
        </div>

        {isApi && (
          <div className="border-t border-border-light px-5 py-3">
            <p className="text-xs italic text-text-dim">
              Sótt úr daily_ad_spend töflu
            </p>
          </div>
        )}

        {category.editable && editing && (
          <div className="border-t border-border-light px-5 py-3">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                placeholder="Nýr kostnaðarliður..."
                className="flex-1 h-auto py-1.5"
              />
              <Button variant="outline" size="xs" onClick={handleAddItem}>
                <Plus className="h-3.5 w-3.5" />
                Bæta við
              </Button>
            </div>
          </div>
        )}

        {category.editable && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex w-full items-center justify-center gap-1 border-t border-border-light py-2.5 text-xs font-medium text-text-dim transition-all duration-200 hover:bg-[rgba(255,255,255,0.06)] hover:text-text-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
            Bæta við lið
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export default function CostPage() {
  const [categories, setCategories] = useState<CostCategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    try {
      // Fetch fixed costs and ad spend in parallel
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

      const [costsRes, adSpendRes] = await Promise.all([
        supabase.from("fixed_costs").select() as unknown as { data: FixedCostRow[] | null; error: unknown },
        supabase
          .from("daily_ad_spend")
          .select()
          .gte("date", monthStart)
          .lt("date", monthEnd) as unknown as { data: AdSpendRow[] | null; error: unknown },
      ]);

      const fixedCosts = costsRes.data ?? [];
      const adSpend = adSpendRes.data ?? [];

      // Group fixed costs by category
      const grouped: Record<string, CostItem[]> = {};
      for (const row of fixedCosts) {
        if (!grouped[row.category]) grouped[row.category] = [];
        grouped[row.category].push({
          dbId: row.id,
          name: row.name,
          amount: row.monthly_amount,
        });
      }

      // Sum ad spend by platform for current month
      const adByPlatform: Record<string, number> = {};
      for (const row of adSpend) {
        adByPlatform[row.platform] = (adByPlatform[row.platform] || 0) + row.amount;
      }

      // Build category data
      const catData: CostCategoryData[] = CATEGORY_CONFIG.map((config) => {
        if (config.id === "ads-daily") {
          // Ad spend from daily_ad_spend
          const adItems: CostItem[] = [];
          if (adByPlatform["meta"] !== undefined) {
            adItems.push({ name: "Meta (Facebook/Instagram)", amount: adByPlatform["meta"] });
          }
          if (adByPlatform["google"] !== undefined) {
            adItems.push({ name: "Google Ads", amount: adByPlatform["google"] });
          }
          // If no data yet, show zeros
          if (adItems.length === 0) {
            adItems.push({ name: "Meta (Facebook/Instagram)", amount: 0 });
            adItems.push({ name: "Google Ads", amount: 0 });
          }
          return { ...config, items: adItems };
        }

        return {
          ...config,
          items: grouped[config.dbCategory!] || [],
        };
      });

      setCategories(catData);
    } catch (err) {
      console.error("Error loading costs:", err);
      toast.error("Villa við að sækja kostnaðargögn");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (catId: string, items: CostItem[]) => {
    const config = CATEGORY_CONFIG.find((c) => c.id === catId);
    if (!config?.dbCategory) return;

    const supabase = createClient();
    const dbCat = config.dbCategory;

    try {
      // Get current DB items for this category to find deletions
      const { data: currentRows } = await supabase
        .from("fixed_costs")
        .select()
        .eq("category", dbCat) as unknown as { data: FixedCostRow[] | null };

      const currentIds = new Set((currentRows ?? []).map((r) => r.id));
      const keptIds = new Set(items.filter((i) => i.dbId).map((i) => i.dbId!));

      // Delete removed items
      const toDelete = [...currentIds].filter((id) => !keptIds.has(id));
      if (toDelete.length > 0) {
        const { error } = await (supabase
          .from("fixed_costs") as ReturnType<typeof supabase.from>)
          .delete()
          .in("id", toDelete);
        if (error) throw error;
      }

      // Upsert existing + new items
      const upsertRows = items.map((item) => ({
        ...(item.dbId ? { id: item.dbId } : {}),
        name: item.name,
        category: dbCat,
        monthly_amount: item.amount,
      }));

      if (upsertRows.length > 0) {
        const { error } = await (supabase
          .from("fixed_costs") as ReturnType<typeof supabase.from>)
          .upsert(upsertRows);
        if (error) throw error;
      }

      toast.success("Kostnaður vistaður");

      // Reload to get fresh IDs for new items
      await loadData();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Villa við vistun kostnaðar");
      throw err; // Re-throw so card knows save failed
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-text-dim" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kostnaður"
        subtitle="Yfirlit yfir fastan og breytilegan kostnað"
      />

      <TotalCostChart />

      <div className="grid grid-cols-2 gap-6">
        {categories.map((cat) => (
          <EditableCostCard
            key={cat.id}
            category={cat}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  );
}
