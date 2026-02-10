"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
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
import { categoryLabels } from "@/lib/data/products";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database, ProductCategory } from "@/lib/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type DailySalesRow = Database["public"]["Tables"]["daily_sales"]["Row"];
type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type ChainPriceRow = Database["public"]["Tables"]["chain_prices"]["Row"];

interface ProductRanking {
  name: string;
  category: ProductCategory;
  boxes30d: number;
  revenue: number;
  margin: number;
  trend: number | null; // null if no previous period data
}

const categoryBadgeVariant: Record<string, "success" | "info" | "warning" | "danger"> = {
  hydration: "info",
  creatine: "success",
  energy: "warning",
  kids: "danger",
};

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ProductsPage() {
  const [rankings, setRankings] = useState<ProductRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const [productsRes, salesRes, storesRes, pricesRes] = await Promise.all([
        supabase.from("products").select() as unknown as { data: ProductRow[] | null; error: unknown },
        supabase
          .from("daily_sales")
          .select()
          .gte("date", formatDate(sixtyDaysAgo)) as unknown as { data: DailySalesRow[] | null; error: unknown },
        supabase.from("stores").select("id,chain_id") as unknown as { data: Pick<StoreRow, "id" | "chain_id">[] | null; error: unknown },
        supabase.from("chain_prices").select() as unknown as { data: ChainPriceRow[] | null; error: unknown },
      ]);

      const products = productsRes.data ?? [];
      const sales = salesRes.data ?? [];
      const stores = storesRes.data ?? [];
      const prices = pricesRes.data ?? [];

      if (products.length === 0) {
        setLoading(false);
        return;
      }

      // Build lookup maps
      const storeChainMap: Record<string, string> = {}; // store_id → chain_id
      for (const s of stores) {
        storeChainMap[s.id] = s.chain_id;
      }

      // chain_id + category → price_per_box
      const priceMap: Record<string, number> = {};
      for (const p of prices) {
        priceMap[`${p.chain_id}:${p.product_category}`] = p.price_per_box;
      }

      // Average price per category (fallback when chain price missing)
      const categoryPriceSum: Record<string, { total: number; count: number }> = {};
      for (const p of prices) {
        if (!categoryPriceSum[p.product_category]) {
          categoryPriceSum[p.product_category] = { total: 0, count: 0 };
        }
        categoryPriceSum[p.product_category].total += p.price_per_box;
        categoryPriceSum[p.product_category].count += 1;
      }
      const avgPrice: Record<string, number> = {};
      for (const [cat, { total, count }] of Object.entries(categoryPriceSum)) {
        avgPrice[cat] = count > 0 ? Math.round(total / count) : 0;
      }

      const productMap: Record<string, ProductRow> = {};
      for (const p of products) {
        productMap[p.id] = p;
      }

      const thirtyDaysAgoStr = formatDate(thirtyDaysAgo);

      // Aggregate per product: current 30d and previous 30d
      const current: Record<string, { boxes: number; revenue: number }> = {};
      const previous: Record<string, { boxes: number }> = {};

      for (const sale of sales) {
        const product = productMap[sale.product_id];
        if (!product) continue;

        const chainId = storeChainMap[sale.store_id];
        const priceKey = `${chainId}:${product.category}`;
        const price = priceMap[priceKey] ?? avgPrice[product.category] ?? 0;

        if (sale.date >= thirtyDaysAgoStr) {
          // Current 30 days
          if (!current[sale.product_id]) current[sale.product_id] = { boxes: 0, revenue: 0 };
          current[sale.product_id].boxes += sale.quantity;
          current[sale.product_id].revenue += sale.quantity * price;
        } else {
          // Previous 30 days (for trend)
          if (!previous[sale.product_id]) previous[sale.product_id] = { boxes: 0 };
          previous[sale.product_id].boxes += sale.quantity;
        }
      }

      // Build rankings
      const ranked: ProductRanking[] = products
        .map((product) => {
          const cur = current[product.id] ?? { boxes: 0, revenue: 0 };
          const prev = previous[product.id] ?? { boxes: 0 };

          const cost = product.production_cost * cur.boxes;
          const margin = cur.revenue > 0
            ? Math.round(((cur.revenue - cost) / cur.revenue) * 100)
            : 0;

          let trend: number | null = null;
          if (prev.boxes > 0) {
            trend = Math.round(((cur.boxes - prev.boxes) / prev.boxes) * 100);
          } else if (cur.boxes > 0) {
            trend = 100; // New product
          }

          return {
            name: product.name,
            category: product.category as ProductCategory,
            boxes30d: cur.boxes,
            revenue: cur.revenue,
            margin,
            trend,
          };
        })
        .filter((r) => r.boxes30d > 0 || r.trend !== null)
        .sort((a, b) => b.boxes30d - a.boxes30d);

      setRankings(ranked);
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Vörur" subtitle="Afkoma eftir vöru - síðastliðir 30 dagar" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-dim" />
          <span className="ml-3 text-sm text-text-dim">Sæki vörugögn...</span>
        </div>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Vörur" subtitle="Afkoma eftir vöru - síðastliðir 30 dagar" />
        <Card>
          <div className="p-8 text-center">
            <p className="text-sm text-text-secondary">Engin sölugögn fundust fyrir síðustu 30 daga.</p>
            <p className="mt-1 text-xs text-text-dim">Skráðu sölu á Skrá gögn síðunni eða hlaðið upp Excel.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Vörur" subtitle="Afkoma eftir vöru - síðastliðir 30 dagar" />

      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-elevated/50">
              <TableHead>#</TableHead>
              <TableHead>Bragð</TableHead>
              <TableHead>Flokkur</TableHead>
              <TableHead className="text-right">Kassar (30d)</TableHead>
              <TableHead className="text-right">Tekjur</TableHead>
              <TableHead className="text-right">Framlegð %</TableHead>
              <TableHead className="text-right">Þróun</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((product, i) => (
              <TableRow key={product.name}>
                <TableCell className="font-medium text-text-dim">
                  {i + 1}
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  {product.name}
                </TableCell>
                <TableCell>
                  <Badge variant={categoryBadgeVariant[product.category]}>
                    {categoryLabels[product.category]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {product.boxes30d}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {formatKr(product.revenue)}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {product.margin}%
                </TableCell>
                <TableCell className="text-right">
                  {product.trend !== null ? (
                    <div className="flex items-center justify-end gap-1">
                      {product.trend >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-danger" />
                      )}
                      <span
                        className={
                          product.trend >= 0 ? "text-primary font-semibold" : "text-danger font-semibold"
                        }
                      >
                        {product.trend >= 0 ? "+" : ""}
                        {product.trend}%
                      </span>
                    </div>
                  ) : (
                    <Minus className="ml-auto h-3.5 w-3.5 text-text-dim" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
