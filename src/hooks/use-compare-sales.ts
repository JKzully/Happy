"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import type { DateRange } from "@/lib/date-ranges";
import type { Database } from "@/lib/database.types";

type ChainPriceRow = Database["public"]["Tables"]["chain_prices"]["Row"];

interface PriceLookup {
  [slug: string]: { [category: string]: number };
}

interface ShopifyPriceLookup {
  [category: string]: { retail: number; subscription: number };
}

export interface ChainCompare {
  chainId: string;
  currentBoxes: number;
  currentRevenue: number;
  lastYearBoxes: number;
  lastYearRevenue: number;
  hasCurrentData: boolean;
}

export interface CompareSalesResult {
  isLoading: boolean;
  chains: ChainCompare[];
  totalCurrentRevenue: number;
  totalCurrentBoxes: number;
  totalLastYearRevenue: number;
  totalLastYearBoxes: number;
}

function shiftYearBack(range: DateRange): DateRange {
  const from = new Date(range.from + "T00:00:00");
  const to = new Date(range.to + "T00:00:00");
  from.setFullYear(from.getFullYear() - 1);
  to.setFullYear(to.getFullYear() - 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export function useCompareSales(range: DateRange): CompareSalesResult {
  const [isLoading, setIsLoading] = useState(true);
  const [chains, setChains] = useState<ChainCompare[]>([]);
  const [totalCurrentRevenue, setTotalCurrentRevenue] = useState(0);
  const [totalCurrentBoxes, setTotalCurrentBoxes] = useState(0);
  const [totalLastYearRevenue, setTotalLastYearRevenue] = useState(0);
  const [totalLastYearBoxes, setTotalLastYearBoxes] = useState(0);
  const priceCache = useRef<PriceLookup | null>(null);
  const shopifyPriceCache = useRef<ShopifyPriceLookup | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      const supabase = createClient();

      // 1. Fetch chain_prices (cached)
      if (!priceCache.current) {
        const { data: pricesRaw } = await supabase
          .from("chain_prices")
          .select("*, retail_chains(slug)") as {
          data: (ChainPriceRow & { retail_chains: { slug: string } | null })[] | null;
        };

        const lookup: PriceLookup = {};
        for (const p of pricesRaw ?? []) {
          const slug = p.retail_chains?.slug;
          if (!slug) continue;
          if (!lookup[slug]) lookup[slug] = {};
          lookup[slug][p.product_category] = p.price_per_box;
        }
        // Shopify: fetch from shopify_prices table (both retail + subscription)
        const { data: shopifyPrices } = await supabase
          .from("shopify_prices")
          .select("retail_price, subscription_price, products(category)") as {
          data: { retail_price: number; subscription_price: number; products: { category: string } | null }[] | null;
        };
        lookup["shopify"] = {};
        const spLookup: ShopifyPriceLookup = {};
        for (const sp of shopifyPrices ?? []) {
          const cat = sp.products?.category;
          if (cat) {
            lookup["shopify"][cat] = sp.retail_price;
            spLookup[cat] = { retail: sp.retail_price, subscription: sp.subscription_price };
          }
        }
        shopifyPriceCache.current = spLookup;
        if (lookup["kronan"]) lookup["n1"] = { ...lookup["kronan"] };
        priceCache.current = lookup;
      }
      const prices = priceCache.current;

      // 2. Date ranges
      const lyRange = shiftYearBack(range);

      // 3. Parallel queries
      type SalesRow = {
        quantity: number;
        order_type: string;
        stores: { chain_id: string; retail_chains: { slug: string } };
        products: { category: string };
      };
      type DbRes<T> = { data: T[] | null; error: { message: string } | null };
      type HistRow = Database["public"]["Tables"]["historical_daily_sales"]["Row"];

      const [currentRows, historicalRes] = await Promise.all([
        fetchAllRows<SalesRow>((from, to) =>
          supabase
            .from("daily_sales")
            .select(
              "quantity, order_type, stores!inner(chain_id, retail_chains!inner(slug)), products!inner(category)"
            )
            .gte("date", range.from)
            .lte("date", range.to)
            .range(from, to) as unknown as Promise<{ data: SalesRow[] | null }>,
        ),

        supabase
          .from("historical_daily_sales")
          .select()
          .gte("date", lyRange.from)
          .lte("date", lyRange.to) as unknown as Promise<DbRes<HistRow>>,
      ]);

      if (cancelled) return;

      // Aggregate current by chain
      const spPrices = shopifyPriceCache.current ?? {};
      const chainAgg: Record<string, { boxes: number; revenue: number }> = {};
      for (const row of currentRows) {
        const slug = row.stores.retail_chains.slug;
        const cat = row.products.category;
        let price = prices[slug]?.[cat] ?? 1300;
        if (slug === "shopify" && row.order_type === "subscription" && spPrices[cat]) {
          price = spPrices[cat].subscription;
        }
        if (!chainAgg[slug]) chainAgg[slug] = { boxes: 0, revenue: 0 };
        chainAgg[slug].boxes += row.quantity;
        chainAgg[slug].revenue += row.quantity * price;
      }

      // Aggregate historical by chain
      const chainHist: Record<string, { boxes: number; revenue: number }> = {};
      for (const row of historicalRes.data ?? []) {
        const slug = row.chain_slug;
        const p = prices[slug];
        const hydPrice = p?.hydration ?? 1300;
        const cePrice = p?.creatine ?? p?.energy ?? 1300;
        const rev = row.hydration_boxes * hydPrice + row.creatine_energy_boxes * cePrice;
        if (!chainHist[slug]) chainHist[slug] = { boxes: 0, revenue: 0 };
        chainHist[slug].boxes += row.total_boxes;
        chainHist[slug].revenue += rev;
      }

      // Build compare data
      const allSlugs = new Set([
        ...Object.keys(chainAgg),
        ...Object.keys(chainHist),
        "kronan",
        "samkaup",
        "bonus",
        "hagkaup",
        "shopify",
        "n1",
      ]);

      const compareData: ChainCompare[] = [];
      for (const slug of allSlugs) {
        const current = chainAgg[slug] ?? { boxes: 0, revenue: 0 };
        const hist = chainHist[slug] ?? { boxes: 0, revenue: 0 };
        compareData.push({
          chainId: slug,
          currentBoxes: current.boxes,
          currentRevenue: current.revenue,
          lastYearBoxes: hist.boxes,
          lastYearRevenue: hist.revenue,
          hasCurrentData: current.boxes > 0,
        });
      }

      // Sort by current revenue descending, then historical
      compareData.sort(
        (a, b) => b.currentRevenue - a.currentRevenue || b.lastYearRevenue - a.lastYearRevenue
      );

      const totCurRev = compareData.reduce((s, c) => s + c.currentRevenue, 0);
      const totCurBox = compareData.reduce((s, c) => s + c.currentBoxes, 0);
      const totLyRev = compareData.reduce((s, c) => s + c.lastYearRevenue, 0);
      const totLyBox = compareData.reduce((s, c) => s + c.lastYearBoxes, 0);

      setChains(compareData);
      setTotalCurrentRevenue(totCurRev);
      setTotalCurrentBoxes(totCurBox);
      setTotalLastYearRevenue(totLyRev);
      setTotalLastYearBoxes(totLyBox);
      setIsLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to]);

  return {
    isLoading,
    chains,
    totalCurrentRevenue,
    totalCurrentBoxes,
    totalLastYearRevenue,
    totalLastYearBoxes,
  };
}
