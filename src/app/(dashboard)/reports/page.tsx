"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Loader2, Download, Table2 } from "lucide-react";
import { usePeriodSales } from "@/hooks/use-period-sales";
import { useAdSpend } from "@/hooks/use-ad-spend";
import { createClient } from "@/lib/supabase/client";
import { formatKr } from "@/lib/format";
import { getDateRange } from "@/lib/date-ranges";
import type { ReportData, CostCategoryDetail } from "@/lib/pdf/generate-report";
import type { Database } from "@/lib/database.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CostCategoryRow = Database["public"]["Tables"]["cost_categories"]["Row"];
type CostItemRow = Database["public"]["Tables"]["cost_items"]["Row"];
type MonthlyEntryRow = Database["public"]["Tables"]["monthly_cost_entries"]["Row"];

function useFixedCosts() {
  const [costCategories, setCostCategories] = useState<CostCategoryDetail[]>([]);
  const [totalCostWithVsk, setTotalCostWithVsk] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const [catsRes, itemsRes, entriesRes] = await Promise.all([
        supabase.from("cost_categories").select().order("sort_order") as unknown as { data: CostCategoryRow[] | null },
        supabase.from("cost_items").select() as unknown as { data: CostItemRow[] | null },
        supabase.from("monthly_cost_entries").select().eq("month", currentMonth) as unknown as { data: MonthlyEntryRow[] | null },
      ]);

      const cats = catsRes.data ?? [];
      const items = itemsRes.data ?? [];
      const entries = entriesRes.data ?? [];

      const entryMap = new Map(entries.map(e => [e.cost_item_id, e]));

      const grouped: Record<string, { items: { name: string; amount: number; withVsk: number }[]; totalAmount: number; totalWithVsk: number }> = {};

      for (const cat of cats) {
        const catItems = items.filter(i => i.category_id === cat.id);
        if (catItems.length === 0) continue;

        grouped[cat.name] = { items: [], totalAmount: 0, totalWithVsk: 0 };

        for (const item of catItems) {
          const entry = entryMap.get(item.id);
          const amount = entry?.actual_amount ?? 0;
          const withVsk = amount * (1 + item.vsk_percent / 100);
          grouped[cat.name].items.push({ name: item.name, amount, withVsk });
          grouped[cat.name].totalAmount += amount;
          grouped[cat.name].totalWithVsk += withVsk;
        }
      }

      const result: CostCategoryDetail[] = Object.entries(grouped).map(([name, vals]) => ({
        name,
        items: vals.items,
        totalAmount: vals.totalAmount,
        totalWithVsk: vals.totalWithVsk,
      }));
      const total = result.reduce((s, c) => s + c.totalWithVsk, 0);

      setCostCategories(result);
      setTotalCostWithVsk(total);
      setIsLoading(false);
    }

    load();
  }, []);

  return { costCategories, totalCostWithVsk, isLoading };
}

function ReportCard({
  title,
  description,
  icon: Icon,
  revenue,
  isDataLoading,
  onDownload,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  revenue: number;
  isDataLoading: boolean;
  onDownload: () => Promise<void>;
}) {
  const [generating, setGenerating] = useState(false);

  const handleClick = async () => {
    setGenerating(true);
    try {
      await onDownload();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-sm text-text-dim">{description}</p>
            <div className="mt-3">
              {isDataLoading ? (
                <div className="flex items-center gap-2 text-sm text-text-dim">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sæki gögn...
                </div>
              ) : (
                <p className="text-lg font-bold text-foreground">{formatKr(revenue)}</p>
              )}
            </div>
            <Button
              className="mt-4"
              size="sm"
              disabled={isDataLoading || generating}
              onClick={handleClick}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {generating ? "Bý til skýrslu..." : "Sækja skýrslu"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type ExcelPeriod = "week" | "2weeks" | "month" | "3months";

const excelPeriodLabels: Record<ExcelPeriod, string> = {
  week: "Síðustu 7 dagar",
  "2weeks": "Síðustu 14 dagar",
  month: "Síðustu 30 dagar",
  "3months": "Síðustu 90 dagar",
};

function getExcelDateRange(period: ExcelPeriod): { from: string; to: string } {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const from = new Date(today);
  switch (period) {
    case "week": from.setDate(from.getDate() - 6); break;
    case "2weeks": from.setDate(from.getDate() - 13); break;
    case "month": from.setDate(from.getDate() - 29); break;
    case "3months": from.setDate(from.getDate() - 89); break;
  }
  return { from: from.toISOString().slice(0, 10), to };
}

export default function ReportsPage() {
  const weekSales = usePeriodSales("week");
  const monthSales = usePeriodSales("month");
  const weekAds = useAdSpend("week", weekSales.totalRevenue);
  const monthAds = useAdSpend("month", monthSales.totalRevenue);
  const { costCategories, totalCostWithVsk, isLoading: costLoading } = useFixedCosts();

  const weekRange = getDateRange("week");
  const monthRange = getDateRange("month");

  const [excelPeriod, setExcelPeriod] = useState<ExcelPeriod>("month");
  const [excelGenerating, setExcelGenerating] = useState(false);

  const handleWeekDownload = useCallback(async () => {
    const { generateReport } = await import("@/lib/pdf/generate-report");
    const reportData: ReportData = {
      type: "week",
      dateRange: weekRange,
      channels: weekSales.channels,
      totalRevenue: weekSales.totalRevenue,
      adSpend: weekAds.data,
      totalAdSpend: weekAds.totalSpend,
    };
    generateReport(reportData);
  }, [weekSales.channels, weekSales.totalRevenue, weekAds.data, weekAds.totalSpend, weekRange]);

  const handleMonthDownload = useCallback(async () => {
    const { generateReport } = await import("@/lib/pdf/generate-report");
    const reportData: ReportData = {
      type: "month",
      dateRange: monthRange,
      channels: monthSales.channels,
      totalRevenue: monthSales.totalRevenue,
      adSpend: monthAds.data,
      totalAdSpend: monthAds.totalSpend,
      costCategories,
      totalCostWithVsk,
    };
    generateReport(reportData);
  }, [monthSales.channels, monthSales.totalRevenue, monthAds.data, monthAds.totalSpend, monthRange, costCategories, totalCostWithVsk]);

  const handleExcelDownload = useCallback(async () => {
    setExcelGenerating(true);
    try {
      const { downloadFormattedSales } = await import("@/lib/excel/export-sales");
      const range = getExcelDateRange(excelPeriod);
      await downloadFormattedSales(range.from, range.to);
    } finally {
      setExcelGenerating(false);
    }
  }, [excelPeriod]);

  const excelRange = getExcelDateRange(excelPeriod);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skýrslur"
        subtitle="Sæktu PDF yfirlit eða Excel sölugögn"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ReportCard
          title="Vikuskýrsla"
          description={`${weekRange.from} — ${weekRange.to}`}
          icon={FileText}
          revenue={weekSales.totalRevenue}
          isDataLoading={weekSales.isLoading || weekAds.isLoading}
          onDownload={handleWeekDownload}
        />
        <ReportCard
          title="Mánaðarskýrsla"
          description={`${monthRange.from} — ${monthRange.to}`}
          icon={Calendar}
          revenue={monthSales.totalRevenue}
          isDataLoading={monthSales.isLoading || monthAds.isLoading || costLoading}
          onDownload={handleMonthDownload}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <Table2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-foreground">
                Excel sölugögn
              </h3>
              <p className="mt-1 text-sm text-text-dim">
                Sæktu sölugögn á formattað Excel skjal til að skoða, greina og deila
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Select
                  value={excelPeriod}
                  onValueChange={(v) => setExcelPeriod(v as ExcelPeriod)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(excelPeriodLabels) as [ExcelPeriod, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <span className="text-xs text-text-dim">
                  {excelRange.from} — {excelRange.to}
                </span>
              </div>
              <p className="mt-2 text-xs text-text-dim">
                3 sheet: Yfirlit (per keðju og vöru), Sundurliðun (öll gögn), Keðja × Vara (pivot tafla)
              </p>
              <Button
                className="mt-4"
                size="sm"
                disabled={excelGenerating}
                onClick={handleExcelDownload}
              >
                {excelGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {excelGenerating ? "Bý til Excel..." : "Sækja Excel"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
