"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import {
  ChainInputCard,
  emptyProductValues,
} from "@/components/input/chain-input-card";
import type { StoreEntry } from "@/components/input/chain-input-card";
import { chains } from "@/lib/data/chains";
import type { Store } from "@/lib/data/chains";
import { products } from "@/lib/data/products";
import { Eraser, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExcelUpload } from "@/components/input/excel-upload";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type ChainRow = Database["public"]["Tables"]["retail_chains"]["Row"];
type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const inputChains = chains.filter(
  (c) => c.id !== "shopify" && c.id !== "n1"
);

function initialEntries(): Record<string, StoreEntry[]> {
  const result: Record<string, StoreEntry[]> = {};
  for (const chain of inputChains) {
    result[chain.id] = [{ storeId: "", values: emptyProductValues() }];
  }
  return result;
}

export default function InputPage() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [entries, setEntries] = useState(initialEntries);
  const [saving, setSaving] = useState(false);

  // Real store data from Supabase, keyed by chain slug
  const [storesByChain, setStoresByChain] = useState<Record<string, Store[]>>(
    {}
  );
  // Map: chain slug → chain UUID
  const [chainSlugToId, setChainSlugToId] = useState<Record<string, string>>(
    {}
  );
  // Map: product slug (from products.ts) → product UUID (from Supabase)
  const [productSlugToUuid, setProductSlugToUuid] = useState<
    Record<string, string>
  >({});
  const [loadingStores, setLoadingStores] = useState(true);

  // Fetch stores, chains, products from Supabase on mount
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const [chainsRes, storesRes, productsRes] = await Promise.all([
        supabase.from("retail_chains").select() as unknown as { data: ChainRow[] | null; error: unknown },
        supabase.from("stores").select() as unknown as { data: StoreRow[] | null; error: unknown },
        supabase.from("products").select() as unknown as { data: ProductRow[] | null; error: unknown },
      ]);

      // Build chain slug → UUID map
      const slugMap: Record<string, string> = {};
      const uuidToSlug: Record<string, string> = {};
      if (chainsRes.data) {
        for (const c of chainsRes.data) {
          slugMap[c.slug] = c.id;
          uuidToSlug[c.id] = c.slug;
        }
      }
      setChainSlugToId(slugMap);

      // Build stores grouped by chain slug
      const grouped: Record<string, Store[]> = {};
      if (storesRes.data) {
        for (const s of storesRes.data) {
          const chainSlug = uuidToSlug[s.chain_id];
          if (!chainSlug) continue;
          if (!grouped[chainSlug]) grouped[chainSlug] = [];
          grouped[chainSlug].push({
            id: s.id,
            name: s.name,
            chainId: chainSlug,
            subChainId: s.sub_chain_type ?? undefined,
          });
        }
        // Sort stores alphabetically within each chain
        for (const slug of Object.keys(grouped)) {
          grouped[slug].sort((a, b) => a.name.localeCompare(b.name, "is"));
        }
      }
      setStoresByChain(grouped);

      // Build product slug → UUID map
      const prodMap: Record<string, string> = {};
      if (productsRes.data) {
        for (const p of productsRes.data) {
          // Match by lowercased name
          const key = p.name.toLowerCase();
          prodMap[key] = p.id;
          // Also try without accents
          const normalized = key
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          prodMap[normalized] = p.id;
        }
      }
      // Also map the local product slugs to UUIDs by matching names
      if (productsRes.data) {
        for (const localProd of products) {
          const dbProd = productsRes.data.find(
            (p) => p.name.toLowerCase() === localProd.name.toLowerCase()
          );
          if (dbProd) {
            prodMap[localProd.id] = dbProd.id;
          }
        }
      }
      setProductSlugToUuid(prodMap);
      setLoadingStores(false);
    }

    fetchData();
  }, []);

  const handleAddEntry = (chainId: string) => {
    setEntries((prev) => ({
      ...prev,
      [chainId]: [
        ...prev[chainId],
        { storeId: "", values: emptyProductValues() },
      ],
    }));
  };

  const handleRemoveEntry = (chainId: string, index: number) => {
    setEntries((prev) => {
      const chainEntries = prev[chainId].filter((_, i) => i !== index);
      if (chainEntries.length === 0) {
        chainEntries.push({ storeId: "", values: emptyProductValues() });
      }
      return { ...prev, [chainId]: chainEntries };
    });
  };

  const handleStoreChange = (
    chainId: string,
    index: number,
    storeId: string
  ) => {
    setEntries((prev) => ({
      ...prev,
      [chainId]: prev[chainId].map((entry, i) =>
        i === index ? { ...entry, storeId } : entry
      ),
    }));
  };

  const handleValueChange = (
    chainId: string,
    index: number,
    productId: string,
    value: number
  ) => {
    setEntries((prev) => ({
      ...prev,
      [chainId]: prev[chainId].map((entry, i) =>
        i === index
          ? { ...entry, values: { ...entry.values, [productId]: value } }
          : entry
      ),
    }));
  };

  const handleClear = () => {
    setEntries(initialEntries());
  };

  // Collect all valid entries (store selected + at least one product > 0)
  const getValidEntries = useCallback(() => {
    const valid: { storeId: string; productSlug: string; quantity: number }[] =
      [];
    for (const chainEntries of Object.values(entries)) {
      for (const entry of chainEntries) {
        if (!entry.storeId) continue;
        for (const [productSlug, qty] of Object.entries(entry.values)) {
          if (qty > 0) {
            valid.push({
              storeId: entry.storeId,
              productSlug,
              quantity: qty,
            });
          }
        }
      }
    }
    return valid;
  }, [entries]);

  const totalEntries = Object.values(entries)
    .flat()
    .filter((e) => e.storeId && Object.values(e.values).some((v) => v > 0))
    .length;

  const handleSave = async () => {
    const validEntries = getValidEntries();
    if (validEntries.length === 0) return;

    setSaving(true);

    try {
      const supabase = createClient();

      // Build upsert rows
      const rows = validEntries.map((entry) => {
        const productUuid = productSlugToUuid[entry.productSlug];
        if (!productUuid) {
          throw new Error(
            `Vara "${entry.productSlug}" finnst ekki í gagnagrunni.`
          );
        }
        return {
          date,
          store_id: entry.storeId,
          product_id: productUuid,
          quantity: entry.quantity,
        };
      });

      const { error } = await (supabase
        .from("daily_sales") as ReturnType<typeof supabase.from>)
        .upsert(rows, { onConflict: "date,store_id,product_id" });

      if (error) {
        throw new Error(error.message);
      }

      const storeCount = new Set(validEntries.map((e) => e.storeId)).size;
      const totalBoxes = validEntries.reduce((sum, e) => sum + e.quantity, 0);

      toast.success(`${totalBoxes} kassar frá ${storeCount} útibúum skráð fyrir ${date}`);

      // Reset form after successful save
      setEntries(initialEntries());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Villa við vistun gagna");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skrá gögn"
        subtitle="Skrá daglega sölu eftir keðju og útibúi"
      >
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-auto"
        />
        <Button variant="outline" onClick={handleClear}>
          <Eraser className="h-4 w-4" />
          Hreinsa
        </Button>
        <Button onClick={handleSave} disabled={saving || totalEntries === 0}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Vista..." : `Vista${totalEntries > 0 ? ` (${totalEntries})` : ""}`}
        </Button>
      </PageHeader>

      <ExcelUpload />

      {loadingStores ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-text-dim" />
          <span className="ml-3 text-sm text-text-dim">Sæki útibú...</span>
        </div>
      ) : (
      <div className="space-y-4">
        {inputChains.map((chain) => {
          const chainStores = storesByChain[chain.id] || [];
          return (
            <ChainInputCard
              key={chain.id}
              chainName={chain.name}
              color={chain.color}
              logo={chain.logo}
              stores={chainStores}
              entries={entries[chain.id] || []}
              samkaupSubChains={chain.id === "samkaup"}
              onAddEntry={() => handleAddEntry(chain.id)}
              onRemoveEntry={(index) => handleRemoveEntry(chain.id, index)}
              onStoreChange={(index, storeId) =>
                handleStoreChange(chain.id, index, storeId)
              }
              onValueChange={(index, productId, value) =>
                handleValueChange(chain.id, index, productId, value)
              }
            />
          );
        })}
      </div>
      )}
    </div>
  );
}
