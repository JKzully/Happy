"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type InventoryRow = Database["public"]["Tables"]["inventory"]["Row"];

export interface LocationDetail {
  locationType: "warehouse" | "store";
  locationName: string;
  chainSlug: string | null;
  quantityBoxes: number;
}

export interface ProductInventory {
  productId: string;
  productName: string;
  category: string;
  warehouseBoxes: number;
  storeBoxes: number;
  totalBoxes: number;
  monthlyRate: number;
  monthsRemaining: number | null;
  status: "red" | "yellow" | "green";
  locations: LocationDetail[];
}

export interface InventoryResult {
  isLoading: boolean;
  products: ProductInventory[];
  totalWarehouse: number;
  totalStore: number;
  totalAll: number;
  refetch: () => void;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useInventory(): InventoryResult {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = () => setFetchKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      const supabase = createClient();

      const now = new Date();
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const [productsRes, inventoryRes, salesRes] = await Promise.all([
        supabase.from("products").select() as unknown as {
          data: ProductRow[] | null;
        },
        supabase.from("inventory").select() as unknown as {
          data: InventoryRow[] | null;
        },
        supabase
          .from("daily_sales")
          .select("product_id, quantity")
          .gte("date", formatDate(ninetyDaysAgo)) as unknown as {
          data: { product_id: string; quantity: number }[] | null;
        },
      ]);

      if (cancelled) return;

      const allProducts = productsRes.data ?? [];
      const inventoryRows = inventoryRes.data ?? [];
      const salesRows = salesRes.data ?? [];

      // Aggregate sales by product over 90 days → monthly rate
      const salesByProduct: Record<string, number> = {};
      for (const s of salesRows) {
        salesByProduct[s.product_id] =
          (salesByProduct[s.product_id] ?? 0) + s.quantity;
      }

      // Group inventory by product
      const invByProduct: Record<string, InventoryRow[]> = {};
      for (const inv of inventoryRows) {
        if (!invByProduct[inv.product_id])
          invByProduct[inv.product_id] = [];
        invByProduct[inv.product_id].push(inv);
      }

      const result: ProductInventory[] = allProducts.map((p) => {
        const rows = invByProduct[p.id] ?? [];
        let warehouseBoxes = 0;
        let storeBoxes = 0;
        const locations: LocationDetail[] = [];

        for (const r of rows) {
          if (r.location_type === "warehouse") {
            warehouseBoxes += r.quantity_boxes;
          } else {
            storeBoxes += r.quantity_boxes;
          }
          locations.push({
            locationType: r.location_type as "warehouse" | "store",
            locationName: r.location_name,
            chainSlug: r.chain_slug,
            quantityBoxes: r.quantity_boxes,
          });
        }

        const totalBoxes = warehouseBoxes + storeBoxes;
        const totalSales90d = salesByProduct[p.id] ?? 0;
        const monthlyRate = totalSales90d / 3;
        const monthsRemaining =
          monthlyRate > 0 ? totalBoxes / monthlyRate : null;

        let status: "red" | "yellow" | "green" = "green";
        if (monthsRemaining !== null) {
          if (monthsRemaining < 5) status = "red";
          else if (monthsRemaining <= 7) status = "yellow";
        }

        return {
          productId: p.id,
          productName: p.name,
          category: p.category,
          warehouseBoxes,
          storeBoxes,
          totalBoxes,
          monthlyRate: Math.round(monthlyRate),
          monthsRemaining,
          status,
          locations,
        };
      });

      result.sort((a, b) => {
        const order = { red: 0, yellow: 1, green: 2 };
        return order[a.status] - order[b.status];
      });

      setProducts(result);
      setIsLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  const totalWarehouse = products.reduce((s, p) => s + p.warehouseBoxes, 0);
  const totalStore = products.reduce((s, p) => s + p.storeBoxes, 0);
  const totalAll = totalWarehouse + totalStore;

  return { isLoading, products, totalWarehouse, totalStore, totalAll, refetch };
}
