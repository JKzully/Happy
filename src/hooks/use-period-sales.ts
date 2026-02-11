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
import type { Database } from "@/lib/database.types";

type ChainPriceRow = Database["public"]["Tables"]["chain_prices"]["Row"];

export interface ChannelData {
  chainId: string;
  boxes: number;
  revenue: number;
  trend: number;
  avg30dRevenue: number;
  lastYearRevenue: number | null;
  lastDataDate: string | null;
  hasData: boolean;
  categoryBoxes: Record<string, number>;
}

interface PriceLookup {
  [slug: string]: { [category: string]: number };
}

export interface ShopifyBreakdown {
  oneTime: { boxes: number; revenue: number };
  subscription: { boxes: number; revenue: number };
}

export interface StoreSale {
  storeId: string;
  storeName: string;
  subChainId?: string;
  flavors: Record<string, number>;
  total: number;
  lastSale: string;
}

interface PeriodSalesResult {
  isLoading: boolean;
  channels: ChannelData[];
  totalRevenue: number;
  lastYearRevenue: number | null;
  shopifyTodayBoxes: number | null;
  shopifyBreakdown: ShopifyBreakdown | null;
  drillDown: Record<string, StoreSale[]>;
}

/** Convert product name from DB → flavor row ID used by drill-down panel */
function productNameToFlavorId(name: string): string {
  const lower = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (lower.startsWith("kids") || lower.startsWith("krakka"))
    return "krakka-happy";
  return lower.replace(/\s+/g, "-");
}

/** Convert a date string to a human-readable "last sale" label */
function lastSaleLabel(date: string | undefined, todayStr: string): string {
  if (!date) return "Engin sala";
  if (date === todayStr) return "Í dag";
  const d = new Date(date + "T00:00:00");
  const t = new Date(todayStr + "T00:00:00");
  const diffDays = Math.round((t.getTime() - d.getTime()) / 86400000);
  if (diffDays === 1) return "Í gær";
  return `${diffDays} dögum síðan`;
}

/** Fetch all rows from a Supabase query, paginating past the 1000-row limit */
async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null }>,
): Promise<T[]> {
  const PAGE = 1000;
  let all: T[] = [];
  let page = 0;
  while (true) {
    const { data } = await buildQuery(page * PAGE, (page + 1) * PAGE - 1);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    page++;
  }
  return all;
}

export function usePeriodSales(period: Period): PeriodSalesResult {
  const [isLoading, setIsLoading] = useState(true);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [lastYearRevenue, setLastYearRevenue] = useState<number | null>(null);
  const [shopifyTodayBoxes, setShopifyTodayBoxes] = useState<number | null>(
    null,
  );
  const [shopifyBreakdown, setShopifyBreakdown] =
    useState<ShopifyBreakdown | null>(null);
  const [drillDown, setDrillDown] = useState<Record<string, StoreSale[]>>({});
  const priceCache = useRef<PriceLookup | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      const supabase = createClient();

      // 1. Fetch chain_prices (cached)
      if (!priceCache.current) {
        const { data: pricesRaw } = (await supabase
          .from("chain_prices")
          .select("*, retail_chains(slug)")) as {
          data:
            | (ChainPriceRow & {
                retail_chains: { slug: string } | null;
              })[]
            | null;
        };

        const lookup: PriceLookup = {};
        for (const p of pricesRaw ?? []) {
          const slug = p.retail_chains?.slug;
          if (!slug) continue;
          if (!lookup[slug]) lookup[slug] = {};
          lookup[slug][p.product_category] = p.price_per_box;
        }
        // Shopify uses direct-to-consumer prices (avg box prices)
        lookup["shopify"] = {
          hydration: 1995,
          creatine: 2890,
          energy: 2890,
          kids: 1690,
        };
        // N1 uses same pricing as Krónan
        if (lookup["kronan"]) lookup["n1"] = { ...lookup["kronan"] };
        priceCache.current = lookup;
      }
      const prices = priceCache.current;

      // 2. Build date ranges
      const range = getDateRange(period);
      const lyRange = getLastYearRange(range);
      const t30d = getTrailing30d();

      // 3. Types for query results
      type SalesRow = {
        date: string;
        quantity: number;
        order_type: string;
        store_id: string;
        stores: {
          id: string;
          name: string;
          chain_id: string;
          sub_chain_type: string | null;
          retail_chains: { slug: string };
        };
        products: { name: string; category: string };
      };
      type TrailingRow = {
        date: string;
        quantity: number;
        order_type: string;
        store_id: string;
        stores: { chain_id: string; retail_chains: { slug: string } };
        products: { category: string };
      };
      type DbRes<T> = {
        data: T[] | null;
        error: { message: string } | null;
      };
      type HistRow =
        Database["public"]["Tables"]["historical_daily_sales"]["Row"];
      type StoreRow = {
        id: string;
        name: string;
        chain_id: string;
        sub_chain_type: string | null;
        retail_chains: { slug: string };
      };

      // 4. Parallel queries (paginated to handle >1000 rows)
      const [currentRows, trailing30Rows, historicalRes, storesRes] =
        await Promise.all([
          fetchAllRows<SalesRow>((from, to) =>
            supabase
              .from("daily_sales")
              .select(
                "date, quantity, order_type, store_id, stores!inner(id, name, chain_id, sub_chain_type, retail_chains!inner(slug)), products!inner(name, category)",
              )
              .gte("date", range.from)
              .lte("date", range.to)
              .range(from, to) as unknown as Promise<{ data: SalesRow[] | null }>,
          ),

          fetchAllRows<TrailingRow>((from, to) =>
            supabase
              .from("daily_sales")
              .select(
                "date, quantity, order_type, store_id, stores!inner(chain_id, retail_chains!inner(slug)), products!inner(category)",
              )
              .gte("date", t30d.from)
              .lte("date", t30d.to)
              .range(from, to) as unknown as Promise<{ data: TrailingRow[] | null }>,
          ),

          supabase
            .from("historical_daily_sales")
            .select()
            .gte("date", lyRange.from)
            .lte("date", lyRange.to) as unknown as Promise<DbRes<HistRow>>,

          supabase
            .from("stores")
            .select(
              "id, name, chain_id, sub_chain_type, retail_chains!inner(slug)",
            ) as unknown as Promise<DbRes<StoreRow>>,
        ]);

      if (cancelled) return;

      // Fetch today's Shopify boxes when viewing yesterday
      if (period === "yesterday") {
        const todayStr = new Date().toISOString().slice(0, 10);
        const { data: shopifyToday } = (await supabase
          .from("daily_sales")
          .select("quantity, stores!inner(retail_chains!inner(slug))")
          .eq("date", todayStr)
          .eq(
            "stores.retail_chains.slug",
            "shopify",
          )) as unknown as DbRes<{ quantity: number }>;
        const todayBoxes = (shopifyToday ?? []).reduce(
          (s, r) => s + r.quantity,
          0,
        );
        setShopifyTodayBoxes(todayBoxes > 0 ? todayBoxes : null);
      } else {
        setShopifyTodayBoxes(null);
      }

      if (cancelled) return;

      const allStores = storesRes.data ?? [];

      // ── Aggregate current period by chain slug ──
      const chainAgg: Record<string, { boxes: number; revenue: number }> = {};
      const chainCatBoxes: Record<string, Record<string, number>> = {};
      const shopifyByType: Record<
        string,
        { boxes: number; revenue: number }
      > = {
        one_time: { boxes: 0, revenue: 0 },
        subscription: { boxes: 0, revenue: 0 },
      };
      for (const row of currentRows) {
        const slug = row.stores.retail_chains.slug;
        const cat = row.products.category;
        const price = prices[slug]?.[cat] ?? 1300; // fallback avg
        if (!chainAgg[slug]) chainAgg[slug] = { boxes: 0, revenue: 0 };
        chainAgg[slug].boxes += row.quantity;
        chainAgg[slug].revenue += row.quantity * price;
        if (!chainCatBoxes[slug]) chainCatBoxes[slug] = {};
        chainCatBoxes[slug][cat] = (chainCatBoxes[slug][cat] || 0) + row.quantity;

        // Track shopify breakdown by order type
        if (slug === "shopify") {
          const ot =
            row.order_type === "subscription" ? "subscription" : "one_time";
          shopifyByType[ot].boxes += row.quantity;
          shopifyByType[ot].revenue += row.quantity * price;
        }
      }

      // ── Aggregate trailing 30d by chain slug ──
      const chain30d: Record<string, { boxes: number; revenue: number }> = {};
      for (const row of trailing30Rows) {
        const slug = row.stores.retail_chains.slug;
        const cat = row.products.category;
        const price = prices[slug]?.[cat] ?? 1300;
        if (!chain30d[slug]) chain30d[slug] = { boxes: 0, revenue: 0 };
        chain30d[slug].boxes += row.quantity;
        chain30d[slug].revenue += row.quantity * price;
      }

      // ── Process historical (last year) ──
      const histRows = historicalRes.data ?? [];
      const chainHist: Record<string, { boxes: number; revenue: number }> = {};
      for (const row of histRows) {
        const slug = row.chain_slug;
        const p = prices[slug];
        const hydPrice = p?.hydration ?? 1300;
        const cePrice = p?.creatine ?? p?.energy ?? 1300;
        const rev =
          row.hydration_boxes * hydPrice + row.creatine_energy_boxes * cePrice;
        if (!chainHist[slug]) chainHist[slug] = { boxes: 0, revenue: 0 };
        chainHist[slug].boxes += row.total_boxes;
        chainHist[slug].revenue += rev;
      }

      // ── Build drill-down per chain ──
      const todayStr = new Date().toISOString().slice(0, 10);

      // Build last-sale-date map from trailing 30d + current data
      const lastSaleByStore: Record<string, string> = {};
      const chainLastDate: Record<string, string> = {};
      for (const row of trailing30Rows) {
        const sid = row.store_id;
        const slug = row.stores.retail_chains.slug;
        if (!lastSaleByStore[sid] || row.date > lastSaleByStore[sid]) {
          lastSaleByStore[sid] = row.date;
        }
        if (!chainLastDate[slug] || row.date > chainLastDate[slug]) {
          chainLastDate[slug] = row.date;
        }
      }
      for (const row of currentRows) {
        const sid = row.store_id;
        const slug = row.stores.retail_chains.slug;
        if (!lastSaleByStore[sid] || row.date > lastSaleByStore[sid]) {
          lastSaleByStore[sid] = row.date;
        }
        if (!chainLastDate[slug] || row.date > chainLastDate[slug]) {
          chainLastDate[slug] = row.date;
        }
      }

      // Aggregate current rows: chain → store → flavorId → quantity
      const storeProductAgg: Record<
        string,
        Record<string, Record<string, number>>
      > = {};
      for (const row of currentRows) {
        const chainSlug = row.stores.retail_chains.slug;
        const storeId = row.stores.id;
        const flavorId = productNameToFlavorId(row.products.name);
        if (!flavorId) continue;
        if (!storeProductAgg[chainSlug]) storeProductAgg[chainSlug] = {};
        if (!storeProductAgg[chainSlug][storeId])
          storeProductAgg[chainSlug][storeId] = {};
        storeProductAgg[chainSlug][storeId][flavorId] =
          (storeProductAgg[chainSlug][storeId][flavorId] || 0) + row.quantity;
      }

      // Build StoreSale[] for each chain from all stores + aggregated sales
      const chainDrillDown: Record<string, StoreSale[]> = {};
      for (const store of allStores) {
        const chainSlug = store.retail_chains.slug;
        if (!chainDrillDown[chainSlug]) chainDrillDown[chainSlug] = [];
        const storeData = storeProductAgg[chainSlug]?.[store.id] ?? {};
        const total = Object.values(storeData).reduce(
          (s, v) => s + v,
          0,
        );
        chainDrillDown[chainSlug].push({
          storeId: store.id,
          storeName: store.name,
          ...(store.sub_chain_type
            ? { subChainId: store.sub_chain_type }
            : {}),
          flavors: storeData,
          total,
          lastSale: lastSaleLabel(lastSaleByStore[store.id], todayStr),
        });
      }

      // ── Build channel data ──
      const hasHistorical = histRows.length > 0;
      const lyTotal = hasHistorical
        ? Object.values(chainHist).reduce((s, h) => s + h.revenue, 0)
        : null;

      const chainsWithData = new Set(
        Object.keys(chainAgg).filter((s) => chainAgg[s].boxes > 0),
      );

      const periodDays = rangeDays(range);
      const allSlugs = new Set([
        ...Object.keys(chainAgg),
        ...Object.keys(chain30d),
        "kronan",
        "samkaup",
        "bonus",
        "hagkaup",
        "shopify",
        "n1",
      ]);

      const channelData: ChannelData[] = [];
      for (const slug of allSlugs) {
        const current = chainAgg[slug] ?? { boxes: 0, revenue: 0 };
        const t30 = chain30d[slug] ?? { boxes: 0, revenue: 0 };
        const hist = chainHist[slug] ?? null;

        const avg30dRevenue = t30.revenue / 30;
        const periodDailyAvg =
          periodDays > 0 ? current.revenue / periodDays : 0;

        // Trend: period daily avg vs 30d daily avg
        const trend =
          avg30dRevenue > 0
            ? Math.round(
                ((periodDailyAvg - avg30dRevenue) / avg30dRevenue) * 100,
              )
            : 0;

        channelData.push({
          chainId: slug,
          boxes: current.boxes,
          revenue: current.revenue,
          trend,
          avg30dRevenue: Math.round(avg30dRevenue),
          lastYearRevenue: hist?.revenue ?? null,
          lastDataDate: chainLastDate[slug] ?? null,
          hasData: chainsWithData.has(slug),
          categoryBoxes: chainCatBoxes[slug] ?? {},
        });
      }

      // Sort by revenue descending
      channelData.sort((a, b) => b.revenue - a.revenue);

      const total = channelData.reduce((s, ch) => s + ch.revenue, 0);

      // Set shopify breakdown (null if no shopify data in period)
      const hasShopifyData =
        shopifyByType.one_time.boxes > 0 ||
        shopifyByType.subscription.boxes > 0;
      setShopifyBreakdown(
        hasShopifyData
          ? {
              oneTime: shopifyByType.one_time,
              subscription: shopifyByType.subscription,
            }
          : null,
      );

      setChannels(channelData);
      setTotalRevenue(total);
      setLastYearRevenue(lyTotal);
      setDrillDown(chainDrillDown);
      setIsLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [period]);

  return {
    isLoading,
    channels,
    totalRevenue,
    lastYearRevenue,
    shopifyTodayBoxes,
    shopifyBreakdown,
    drillDown,
  };
}
