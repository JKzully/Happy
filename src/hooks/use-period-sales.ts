"use client";

import { useState, useEffect, useRef } from "react";
import type { Period } from "@/components/ui/period-tabs";
import { createClient } from "@/lib/supabase/client";
import {
  getDateRange,
  getLastYearRange,
  getTrailing30d,
  rangeDays,
} from "@/lib/date-ranges";
import {
  channelSalesToday,
  totalRevenue as mockTotalRevenue,
  lastYearTotalRevenue as mockLastYearRevenue,
} from "@/lib/data/mock-sales";
import type { Database } from "@/lib/database.types";

type ChainPriceRow = Database["public"]["Tables"]["chain_prices"]["Row"];

export interface ChannelData {
  chainId: string;
  boxes: number;
  revenue: number;
  trend: number;
  avg30dRevenue: number;
  lastYearRevenue: number | null;
}

interface PriceLookup {
  [slug: string]: { [category: string]: number };
}

interface PeriodSalesResult {
  isLoading: boolean;
  channels: ChannelData[];
  totalRevenue: number;
  lastYearRevenue: number | null;
}

export function usePeriodSales(period: Period): PeriodSalesResult {
  const [isLoading, setIsLoading] = useState(true);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [lastYearRevenue, setLastYearRevenue] = useState<number | null>(null);
  const priceCache = useRef<PriceLookup | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      const supabase = createClient();

      // 1. Fetch chain_prices (cached)
      if (!priceCache.current) {
        const { data: pricesRaw } = await supabase
          .from("chain_prices")
          .select("*, retail_chains(slug)") as { data: (ChainPriceRow & { retail_chains: { slug: string } | null })[] | null };

        const lookup: PriceLookup = {};
        for (const p of pricesRaw ?? []) {
          const slug = p.retail_chains?.slug;
          if (!slug) continue;
          if (!lookup[slug]) lookup[slug] = {};
          lookup[slug][p.product_category] = p.price_per_box;
        }
        // Shopify uses direct-to-consumer prices (avg box prices)
        lookup["shopify"] = { hydration: 1995, creatine: 2890, energy: 2890, kids: 1690 };
        // N1 uses same pricing as Krónan
        if (lookup["kronan"]) lookup["n1"] = { ...lookup["kronan"] };
        priceCache.current = lookup;
      }
      const prices = priceCache.current;

      // 2. Build date ranges
      const range = getDateRange(period);
      const lyRange = getLastYearRange(range);
      const t30d = getTrailing30d();

      // 3. Parallel queries
      type SalesRow = {
        quantity: number;
        stores: { chain_id: string; retail_chains: { slug: string } };
        products: { category: string };
      };
      type DbRes<T> = { data: T[] | null; error: { message: string } | null };
      type HistRow = Database["public"]["Tables"]["historical_daily_sales"]["Row"];

      const [currentRes, trailing30Res, historicalRes] = await Promise.all([
        supabase
          .from("daily_sales")
          .select("quantity, stores!inner(chain_id, retail_chains!inner(slug)), products!inner(category)")
          .gte("date", range.from)
          .lte("date", range.to) as unknown as Promise<DbRes<SalesRow>>,

        supabase
          .from("daily_sales")
          .select("quantity, stores!inner(chain_id, retail_chains!inner(slug)), products!inner(category)")
          .gte("date", t30d.from)
          .lte("date", t30d.to) as unknown as Promise<DbRes<SalesRow>>,

        supabase
          .from("historical_daily_sales")
          .select()
          .gte("date", lyRange.from)
          .lte("date", lyRange.to) as unknown as Promise<DbRes<HistRow>>,
      ]);

      if (cancelled) return;

      const currentRows = currentRes.data ?? [];
      const trailing30Rows = trailing30Res.data ?? [];

      // Aggregate current period by chain slug
      const chainAgg: Record<string, { boxes: number; revenue: number }> = {};
      for (const row of currentRows) {
        const slug = row.stores.retail_chains.slug;
        const cat = row.products.category;
        const price = prices[slug]?.[cat] ?? 1300; // fallback avg
        if (!chainAgg[slug]) chainAgg[slug] = { boxes: 0, revenue: 0 };
        chainAgg[slug].boxes += row.quantity;
        chainAgg[slug].revenue += row.quantity * price;
      }

      // Aggregate trailing 30d by chain slug
      const chain30d: Record<string, { boxes: number; revenue: number }> = {};
      for (const row of trailing30Rows) {
        const slug = row.stores.retail_chains.slug;
        const cat = row.products.category;
        const price = prices[slug]?.[cat] ?? 1300;
        if (!chain30d[slug]) chain30d[slug] = { boxes: 0, revenue: 0 };
        chain30d[slug].boxes += row.quantity;
        chain30d[slug].revenue += row.quantity * price;
      }

      // Process historical (last year)
      const histRows = historicalRes.data ?? [];
      const chainHist: Record<string, { boxes: number; revenue: number }> = {};
      for (const row of histRows) {
        const slug = row.chain_slug;
        const p = prices[slug];
        const hydPrice = p?.hydration ?? 1300;
        const cePrice = p?.creatine ?? p?.energy ?? 1300;
        const rev = row.hydration_boxes * hydPrice + row.creatine_energy_boxes * cePrice;
        if (!chainHist[slug]) chainHist[slug] = { boxes: 0, revenue: 0 };
        chainHist[slug].boxes += row.total_boxes;
        chainHist[slug].revenue += rev;
      }

      // 5. Historical totals (always from DB, filtered to matching period)
      const hasHistorical = histRows.length > 0;
      const lyTotal = hasHistorical
        ? Object.values(chainHist).reduce((s, h) => s + h.revenue, 0)
        : null;

      // 6. Check if we got real current-period data
      const hasCurrentData = currentRows.length > 0;

      if (!hasCurrentData) {
        // Fallback current sales to mock, but use real historical for YoY
        setChannels(
          channelSalesToday.map((ch) => ({
            chainId: ch.chainId,
            boxes: ch.boxes,
            revenue: ch.revenue,
            trend: ch.trend,
            avg30dRevenue: ch.avg30dRevenue,
            lastYearRevenue: hasHistorical
              ? chainHist[ch.chainId]?.revenue ?? null
              : ch.lastYearRevenue,
          }))
        );
        setTotalRevenue(mockTotalRevenue);
        setLastYearRevenue(lyTotal ?? mockLastYearRevenue);
        setIsLoading(false);
        return;
      }

      // 7. Build channel data from real data
      const periodDays = rangeDays(range);
      const allSlugs = new Set([
        ...Object.keys(chainAgg),
        ...Object.keys(chain30d),
        "kronan", "samkaup", "bonus", "hagkaup", "shopify", "n1",
      ]);

      const channelData: ChannelData[] = [];
      for (const slug of allSlugs) {
        const current = chainAgg[slug] ?? { boxes: 0, revenue: 0 };
        const t30 = chain30d[slug] ?? { boxes: 0, revenue: 0 };
        const hist = chainHist[slug] ?? null;

        const avg30dRevenue = t30.revenue / 30;
        const periodDailyAvg = periodDays > 0 ? current.revenue / periodDays : 0;

        // Trend: period daily avg vs 30d daily avg
        const trend =
          avg30dRevenue > 0
            ? Math.round(((periodDailyAvg - avg30dRevenue) / avg30dRevenue) * 100)
            : 0;

        channelData.push({
          chainId: slug,
          boxes: current.boxes,
          revenue: current.revenue,
          trend,
          avg30dRevenue: Math.round(avg30dRevenue),
          lastYearRevenue: hist?.revenue ?? null,
        });
      }

      // Sort by revenue descending
      channelData.sort((a, b) => b.revenue - a.revenue);

      const total = channelData.reduce((s, ch) => s + ch.revenue, 0);

      setChannels(channelData);
      setTotalRevenue(total);
      setLastYearRevenue(lyTotal);
      setIsLoading(false);
    }

    fetchData();
    return () => { cancelled = true; };
  }, [period]);

  return { isLoading, channels, totalRevenue, lastYearRevenue };
}
