"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKr } from "@/lib/format";
import { Pencil, Save, Plus, X, Wifi, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
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
  vskPercent: number;
}

interface CostCategoryData {
  id: string;
  dbCategory: string | null; // null for ads-daily
  title: string;
  editable: boolean;
  isCustom: boolean;
  items: CostItem[];
}

interface AreaCategoryConfig {
  dataKey: string;
  name: string;
  color: string;
}

// Default categories that always appear
const DEFAULT_CATEGORIES: {
  id: string;
  dbCategory: string | null;
  title: string;
  editable: boolean;
}[] = [
  { id: "operations", dbCategory: "operations", title: "Rekstur (mánaðarlegur)", editable: true },
  { id: "marketing-fixed", dbCategory: "marketing_fixed", title: "Markaðssetning - fast", editable: true },
  { id: "marketing-variable", dbCategory: "marketing_variable", title: "Markaðssetning - breytilegur", editable: true },
  { id: "ads-daily", dbCategory: null, title: "Meta + Google (daglegt)", editable: false },
];

const DEFAULT_DB_CATEGORIES = new Set(["operations", "marketing_fixed", "marketing_variable"]);

const CHART_COLORS = [
  "#3B82F6", "#22C55E", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
  "#6366F1", "#06B6D4", "#84CC16", "#E11D48",
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

// Convert a DB category string to a safe chart dataKey (no dots/spaces)
function toDataKey(dbCategory: string): string {
  return dbCategory.replace(/[^a-zA-Z0-9_]/g, "_");
}

function TotalCostChart({
  data,
  areaCategories,
}: {
  data: Record<string, unknown>[];
  areaCategories: AreaCategoryConfig[];
}) {
  if (data.length === 0) return null;

  const currentMonth = data[data.length - 1];
  const totalMonthly = areaCategories.reduce(
    (sum, cat) => sum + ((currentMonth[cat.dataKey] as number) ?? 0),
    0
  );

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
            <AreaChart data={data}>
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
  onDelete,
}: {
  category: CostCategoryData;
  onSave: (catId: string, items: CostItem[]) => Promise<void>;
  onDelete?: (catId: string) => void;
}) {
  const [items, setItems] = useState<CostItem[]>(category.items);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  // Sync when parent data changes (after load)
  useEffect(() => {
    setItems(category.items);
  }, [category.items]);

  const total = items.reduce((sum, item) => sum + item.amount * (1 + item.vskPercent / 100), 0);
  const isApi = !category.editable;

  const handleAmountChange = (index: number, value: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, amount: value } : item))
    );
  };

  const handleVskChange = (index: number, value: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, vskPercent: value } : item))
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
    setItems((prev) => [...prev, { name: newItemName.trim(), amount: 0, vskPercent: 0 }]);
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
            {category.isCustom && !editing && onDelete && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onDelete(category.id)}
                className="hover:text-danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
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
          {items.map((item, i) => {
            const withVsk = item.amount * (1 + item.vskPercent / 100);
            return (
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
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-text-dim">VSK</span>
                      <Input
                        type="number"
                        value={item.vskPercent}
                        onChange={(e) =>
                          handleVskChange(i, parseFloat(e.target.value) || 0)
                        }
                        className="w-16 h-auto py-1 text-right font-medium"
                      />
                      <span className="text-xs text-text-dim">%</span>
                    </div>
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
                ) : item.vskPercent > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-dim">{formatKr(item.amount)}</span>
                    <span className="text-xs text-text-dim">VSK {item.vskPercent}%</span>
                    <span className="text-sm font-medium text-foreground">{formatKr(withVsk)}</span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    {formatKr(item.amount)}
                  </span>
                )}
              </div>
            );
          })}
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

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Maí", "Jún", "Júl", "Ágú", "Sep", "Okt", "Nóv", "Des"];

export default function CostPage() {
  const [categories, setCategories] = useState<CostCategoryData[]>([]);
  const [chartData, setChartData] = useState<Record<string, unknown>[]>([]);
  const [areaCategories, setAreaCategories] = useState<AreaCategoryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const loadData = useCallback(async () => {
    const supabase = createClient();

    try {
      // Date range: 6 months back from start of current month
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const sixMonthsAgoStr = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;

      const [costsRes, adSpendRes] = await Promise.all([
        supabase.from("fixed_costs").select() as unknown as { data: FixedCostRow[] | null; error: unknown },
        supabase
          .from("daily_ad_spend")
          .select()
          .gte("date", sixMonthsAgoStr) as unknown as { data: AdSpendRow[] | null; error: unknown },
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
          vskPercent: row.vsk_percent,
        });
      }

      // Sum fixed costs per category (current monthly totals, with VSK)
      const fixedTotals: Record<string, number> = {};
      for (const row of fixedCosts) {
        const withVsk = row.monthly_amount * (1 + row.vsk_percent / 100);
        fixedTotals[row.category] = (fixedTotals[row.category] || 0) + withVsk;
      }

      // Discover custom categories from DB
      const customDbCategories = Object.keys(grouped).filter(
        (cat) => !DEFAULT_DB_CATEGORIES.has(cat)
      );

      // Aggregate ad spend by month (YYYY-MM → total)
      const adByMonth: Record<string, number> = {};
      const adByPlatformCurrentMonth: Record<string, number> = {};
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      for (const row of adSpend) {
        const monthKey = row.date.slice(0, 7); // "YYYY-MM"
        adByMonth[monthKey] = (adByMonth[monthKey] || 0) + row.amount;
        if (monthKey === currentMonthKey) {
          adByPlatformCurrentMonth[row.platform] = (adByPlatformCurrentMonth[row.platform] || 0) + row.amount;
        }
      }

      // Build area categories for chart (default + custom)
      const areas: AreaCategoryConfig[] = [
        { dataKey: "operations", name: "Rekstur", color: CHART_COLORS[0] },
        { dataKey: "marketingFixed", name: "Markaðss. fast", color: CHART_COLORS[1] },
        { dataKey: "marketingVariable", name: "Markaðss. breyt.", color: CHART_COLORS[2] },
        { dataKey: "adsDaily", name: "Meta + Google", color: CHART_COLORS[3] },
      ];
      for (let i = 0; i < customDbCategories.length; i++) {
        const cat = customDbCategories[i];
        areas.push({
          dataKey: toDataKey(cat),
          name: cat,
          color: CHART_COLORS[(4 + i) % CHART_COLORS.length],
        });
      }
      setAreaCategories(areas);

      // Build 6-month chart data
      const months: Record<string, unknown>[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const monthEntry: Record<string, unknown> = {
          month: MONTH_LABELS[d.getMonth()],
          operations: fixedTotals["operations"] || 0,
          marketingFixed: fixedTotals["marketing_fixed"] || 0,
          marketingVariable: fixedTotals["marketing_variable"] || 0,
          adsDaily: adByMonth[key] || 0,
        };
        for (const cat of customDbCategories) {
          monthEntry[toDataKey(cat)] = fixedTotals[cat] || 0;
        }
        months.push(monthEntry);
      }
      setChartData(months);

      // Build category cards
      const catData: CostCategoryData[] = [];

      // Default categories
      for (const config of DEFAULT_CATEGORIES) {
        if (config.id === "ads-daily") {
          const adItems: CostItem[] = [];
          if (adByPlatformCurrentMonth["meta"] !== undefined) {
            adItems.push({ name: "Meta (Facebook/Instagram)", amount: adByPlatformCurrentMonth["meta"], vskPercent: 0 });
          }
          if (adByPlatformCurrentMonth["google"] !== undefined) {
            adItems.push({ name: "Google Ads", amount: adByPlatformCurrentMonth["google"], vskPercent: 0 });
          }
          if (adItems.length === 0) {
            adItems.push({ name: "Meta (Facebook/Instagram)", amount: 0, vskPercent: 0 });
            adItems.push({ name: "Google Ads", amount: 0, vskPercent: 0 });
          }
          catData.push({ ...config, isCustom: false, items: adItems });
        } else {
          catData.push({
            ...config,
            isCustom: false,
            items: grouped[config.dbCategory!] || [],
          });
        }
      }

      // Custom categories discovered from DB
      for (const dbCat of customDbCategories) {
        catData.push({
          id: `custom-${dbCat}`,
          dbCategory: dbCat,
          title: dbCat,
          editable: true,
          isCustom: true,
          items: grouped[dbCat] || [],
        });
      }

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
    // Find the category from current state
    const cat = categories.find((c) => c.id === catId);
    if (!cat?.dbCategory) return;

    const supabase = createClient();
    const dbCat = cat.dbCategory;

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

      // Update existing items
      const existingItems = items.filter((i) => i.dbId);
      for (const item of existingItems) {
        const { error } = await (supabase
          .from("fixed_costs") as ReturnType<typeof supabase.from>)
          .update({ name: item.name, category: dbCat, monthly_amount: item.amount, vsk_percent: item.vskPercent })
          .eq("id", item.dbId!);
        if (error) throw error;
      }

      // Insert new items
      const newItems = items.filter((i) => !i.dbId);
      if (newItems.length > 0) {
        const insertRows = newItems.map((item) => ({
          name: item.name,
          category: dbCat,
          monthly_amount: item.amount,
          vsk_percent: item.vskPercent,
        }));
        const { error } = await (supabase
          .from("fixed_costs") as ReturnType<typeof supabase.from>)
          .insert(insertRows);
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

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;

    // Check for duplicate
    const exists = categories.some(
      (c) => c.dbCategory === name || c.title.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      toast.error("Flokkur með þessu nafni er þegar til");
      return;
    }

    // Add local-only category (will persist once items are saved)
    setCategories((prev) => [
      ...prev,
      {
        id: `custom-${name}`,
        dbCategory: name,
        title: name,
        editable: true,
        isCustom: true,
        items: [],
      },
    ]);

    setNewCategoryName("");
    setAddingCategory(false);
    toast.success(`Flokkur "${name}" bætt við`);
  };

  const handleDeleteCategory = async (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat?.dbCategory) return;

    const hasItems = cat.items.length > 0;
    if (hasItems) {
      const confirmed = window.confirm(
        `Ertu viss um að þú viljir eyða flokknum "${cat.title}" og öllum ${cat.items.length} liðum?`
      );
      if (!confirmed) return;
    }

    const supabase = createClient();
    const dbCat = cat.dbCategory;

    try {
      // Delete all items in this category from DB
      const idsToDelete = cat.items.filter((i) => i.dbId).map((i) => i.dbId!);
      if (idsToDelete.length > 0) {
        const { error } = await (supabase
          .from("fixed_costs") as ReturnType<typeof supabase.from>)
          .delete()
          .eq("category", dbCat);
        if (error) throw error;
      }

      toast.success(`Flokki "${cat.title}" eytt`);
      await loadData();
    } catch (err) {
      console.error("Delete category error:", err);
      toast.error("Villa við að eyða flokki");
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

      <TotalCostChart data={chartData} areaCategories={areaCategories} />

      <div className="grid grid-cols-2 gap-6">
        {categories.map((cat) => (
          <EditableCostCard
            key={cat.id}
            category={cat}
            onSave={handleSave}
            onDelete={cat.isCustom ? handleDeleteCategory : undefined}
          />
        ))}
      </div>

      {/* Add category button / input */}
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
    </div>
  );
}
