"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatKr } from "@/lib/format";
import {
  wholesalePrices as defaultWholesale,
  shopifyPrices as defaultShopify,
  productionCosts as defaultProduction,
  type WholesalePrice,
  type ShopifyPrice,
  type ProductionCost,
} from "@/lib/data/mock-prices";
import { Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import type { Database, ProductCategory } from "@/lib/database.types";

type ChainRow = Database["public"]["Tables"]["retail_chains"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ChainPriceRow = Database["public"]["Tables"]["chain_prices"]["Row"];
type ShopifyPriceRow = Database["public"]["Tables"]["shopify_prices"]["Row"];

type DbResult<T> = { data: T[] | null; error: { message: string } | null };

const CATEGORIES: ProductCategory[] = ["hydration", "creatine", "energy", "kids"];
const CATEGORY_LABELS: Record<ProductCategory, string> = {
  hydration: "Hydration",
  creatine: "Creatine",
  energy: "Energy",
  kids: "Kids",
};

export default function SettingsPage() {
  const [wholesale, setWholesale] = useState<WholesalePrice[]>(defaultWholesale);
  const [shopify, setShopify] = useState<ShopifyPrice[]>(defaultShopify);
  const [production, setProduction] = useState<ProductionCost[]>(defaultProduction);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Maps we need for DB lookups
  const [chainMap, setChainMap] = useState<Record<string, { id: string; name: string; slug: string }>>({});
  const [productMap, setProductMap] = useState<Record<string, { id: string; name: string; category: ProductCategory }>>({});

  const loadData = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      // Fetch all reference data in parallel
      const [chainsRes, productsRes, chainPricesRes, shopifyPricesRes] = await Promise.all([
        supabase.from("retail_chains").select() as unknown as Promise<DbResult<ChainRow>>,
        supabase.from("products").select() as unknown as Promise<DbResult<ProductRow>>,
        supabase.from("chain_prices").select() as unknown as Promise<DbResult<ChainPriceRow>>,
        supabase.from("shopify_prices").select() as unknown as Promise<DbResult<ShopifyPriceRow>>,
      ]);

      const chains = chainsRes.data ?? [];
      const products = productsRes.data ?? [];
      const chainPrices = chainPricesRes.data ?? [];
      const shopifyPricesData = shopifyPricesRes.data ?? [];

      // Build lookup maps
      const cMap: typeof chainMap = {};
      for (const c of chains) {
        cMap[c.slug] = { id: c.id, name: c.name, slug: c.slug };
      }
      setChainMap(cMap);

      const pMap: typeof productMap = {};
      for (const p of products) {
        pMap[p.category] = { id: p.id, name: p.name, category: p.category as ProductCategory };
      }
      setProductMap(pMap);

      // Build wholesale state from DB data
      if (chainPrices.length > 0) {
        // Build a lookup: chainId -> category -> price
        const priceLookup: Record<string, Record<string, number>> = {};
        for (const cp of chainPrices) {
          if (!priceLookup[cp.chain_id]) priceLookup[cp.chain_id] = {};
          priceLookup[cp.chain_id][cp.product_category] = cp.price_per_box;
        }

        const wsData: WholesalePrice[] = defaultWholesale.map((dw) => {
          const chain = cMap[dw.chainId];
          if (!chain) return dw;
          const prices = priceLookup[chain.id];
          if (!prices) return { ...dw, chainName: chain.name };
          return {
            chainId: dw.chainId,
            chainName: chain.name,
            hydration: prices["hydration"] ?? dw.hydration,
            creatine: prices["creatine"] ?? dw.creatine,
            energy: prices["energy"] ?? dw.energy,
            kids: dw.kids === null ? null : (prices["kids"] ?? dw.kids),
          };
        });
        setWholesale(wsData);
      }

      // Build shopify state from DB data
      if (shopifyPricesData.length > 0) {
        const spLookup: Record<string, { retail: number; subscription: number }> = {};
        for (const sp of shopifyPricesData) {
          // Find category for this product_id
          const prod = products.find((p) => p.id === sp.product_id);
          if (prod) {
            spLookup[prod.category] = {
              retail: sp.retail_price,
              subscription: sp.subscription_price,
            };
          }
        }

        const spData: ShopifyPrice[] = defaultShopify.map((ds) => {
          const catKey = ds.category.toLowerCase();
          const dbRow = spLookup[catKey];
          if (!dbRow) return ds;
          const discount = dbRow.retail > 0
            ? Math.round((1 - dbRow.subscription / dbRow.retail) * 100)
            : 0;
          return {
            category: ds.category,
            retail: dbRow.retail,
            subscription: dbRow.subscription,
            discount,
          };
        });
        setShopify(spData);
      }

      // Build production state from DB data
      if (products.length > 0) {
        const prodData: ProductionCost[] = defaultProduction.map((dp) => {
          const catKey = dp.category.toLowerCase();
          const dbProd = products.find((p) => p.category === catKey);
          if (!dbProd) return dp;
          return {
            category: dp.category,
            costPerBox: dbProd.production_cost,
            sticksPerBox: dbProd.sticks_per_box,
          };
        });
        setProduction(prodData);
      }
    } catch {
      setMessage({ type: "error", text: "Villa við að sækja gögn" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    const supabase = createClient();
    setSaving(true);
    setMessage(null);

    try {
      // 1. Upsert chain_prices
      const chainPriceRows: {
        chain_id: string;
        product_category: ProductCategory;
        price_per_box: number;
      }[] = [];

      for (const w of wholesale) {
        const chain = chainMap[w.chainId];
        if (!chain) continue;
        for (const cat of CATEGORIES) {
          const val = w[cat];
          if (val === null) continue;
          chainPriceRows.push({
            chain_id: chain.id,
            product_category: cat,
            price_per_box: val,
          });
        }
      }

      if (chainPriceRows.length > 0) {
        const { error } = await (supabase
          .from("chain_prices") as ReturnType<typeof supabase.from>)
          .upsert(chainPriceRows, { onConflict: "chain_id,product_category" });
        if (error) throw error;
      }

      // 2. Upsert shopify_prices
      const shopifyRows: {
        product_id: string;
        retail_price: number;
        subscription_price: number;
      }[] = [];

      for (const s of shopify) {
        const catKey = s.category.toLowerCase();
        const prod = productMap[catKey];
        if (!prod) continue;
        shopifyRows.push({
          product_id: prod.id,
          retail_price: s.retail,
          subscription_price: s.subscription,
        });
      }

      if (shopifyRows.length > 0) {
        const { error } = await (supabase
          .from("shopify_prices") as ReturnType<typeof supabase.from>)
          .upsert(shopifyRows, { onConflict: "product_id" });
        if (error) throw error;
      }

      // 3. Update products (production_cost, sticks_per_box)
      for (const p of production) {
        const catKey = p.category.toLowerCase();
        const prod = productMap[catKey];
        if (!prod) continue;
        const { error } = await (supabase
          .from("products") as ReturnType<typeof supabase.from>)
          .update({
            production_cost: p.costPerBox,
            sticks_per_box: p.sticksPerBox,
          })
          .eq("id", prod.id);
        if (error) throw error;
      }

      setMessage({ type: "success", text: "Breytingar vistaðar!" });
    } catch (err) {
      console.error("Save error:", err);
      setMessage({ type: "error", text: "Villa við að vista breytingar" });
    } finally {
      setSaving(false);
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
      <PageHeader title="Stillingar" subtitle="Verðskrá og framleiðslukostnaður">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Vista..." : "Vista breytingar"}
        </Button>
      </PageHeader>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}
          className={message.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : ""}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-6">
        {wholesale.map((chain, ci) => (
          <Card key={chain.chainId}>
            <CardHeader>
              <h3 className="text-sm font-semibold text-foreground">
                Heildsöluverð - {chain.chainName}
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <div key={cat}>
                    <label
                      htmlFor={`wholesale-${chain.chainId}-${cat}`}
                      className="mb-1 block text-xs capitalize text-text-dim"
                    >
                      {CATEGORY_LABELS[cat]}
                    </label>
                    <Input
                      id={`wholesale-${chain.chainId}-${cat}`}
                      name={`wholesale-${chain.chainId}-${cat}`}
                      type="number"
                      value={chain[cat] ?? ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setWholesale((prev) =>
                          prev.map((c, i) =>
                            i === ci ? { ...c, [cat]: val } : c
                          )
                        );
                      }}
                      disabled={chain[cat] === null}
                      className="h-auto py-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-foreground">
              Shopify verð
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {shopify.map((row, ri) => (
                <div key={row.category} className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor={`shopify-retail-${row.category}`}
                      className="mb-1 block text-xs text-text-dim"
                    >
                      {row.category} — smásöluverð
                    </label>
                    <Input
                      id={`shopify-retail-${row.category}`}
                      name={`shopify-retail-${row.category}`}
                      type="number"
                      value={row.retail}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setShopify((prev) =>
                          prev.map((r, i) =>
                            i === ri ? { ...r, retail: val } : r
                          )
                        );
                      }}
                      className="h-auto py-2"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`shopify-sub-${row.category}`}
                      className="mb-1 block text-xs text-text-dim"
                    >
                      Áskrift
                    </label>
                    <Input
                      id={`shopify-sub-${row.category}`}
                      name={`shopify-sub-${row.category}`}
                      type="number"
                      value={row.subscription}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setShopify((prev) =>
                          prev.map((r, i) =>
                            i === ri ? { ...r, subscription: val } : r
                          )
                        );
                      }}
                      className="h-auto py-2"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`shopify-disc-${row.category}`}
                      className="mb-1 block text-xs text-text-dim"
                    >
                      Afsláttur %
                    </label>
                    <Input
                      id={`shopify-disc-${row.category}`}
                      name={`shopify-disc-${row.category}`}
                      type="number"
                      value={row.discount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setShopify((prev) =>
                          prev.map((r, i) =>
                            i === ri ? { ...r, discount: val } : r
                          )
                        );
                      }}
                      className="h-auto py-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-foreground">
              Framleiðslukostnaður
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {production.map((row, ri) => (
                <div key={row.category} className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor={`prod-cost-${row.category}`}
                      className="mb-1 block text-xs text-text-dim"
                    >
                      {row.category}
                    </label>
                    <Input
                      id={`prod-cost-${row.category}`}
                      name={`prod-cost-${row.category}`}
                      type="number"
                      value={row.costPerBox}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setProduction((prev) =>
                          prev.map((r, i) =>
                            i === ri ? { ...r, costPerBox: val } : r
                          )
                        );
                      }}
                      className="h-auto py-2"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`prod-sticks-${row.category}`}
                      className="mb-1 block text-xs text-text-dim"
                    >
                      Stykki/kassi
                    </label>
                    <Input
                      id={`prod-sticks-${row.category}`}
                      name={`prod-sticks-${row.category}`}
                      type="number"
                      value={row.sticksPerBox}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setProduction((prev) =>
                          prev.map((r, i) =>
                            i === ri ? { ...r, sticksPerBox: val } : r
                          )
                        );
                      }}
                      className="h-auto py-2"
                    />
                  </div>
                  <div className="flex items-end">
                    <p className="py-2 text-sm text-text-dim">
                      {formatKr(row.costPerBox)} / kassi
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
