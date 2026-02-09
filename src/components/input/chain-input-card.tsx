"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { products } from "@/lib/data/products";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, ChevronDown, ChevronUp, Check } from "lucide-react";
import type { Store } from "@/lib/data/chains";

const subChainLabels: Record<string, string> = {
  netto: "Nettó",
  kjorbudir: "Kjörbuðir",
  iceland: "Iceland",
  extra: "Extra",
  krambud: "Krambuð",
  other: "Annað",
};

export interface StoreEntry {
  storeId: string;
  values: Record<string, number>;
}

function emptyProductValues(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const product of products) {
    result[product.id] = 0;
  }
  return result;
}

function StoreEntryRow({
  entry,
  stores,
  usedStoreIds,
  samkaupSubChains,
  onStoreChange,
  onValueChange,
  onRemove,
}: {
  entry: StoreEntry;
  stores: Store[];
  usedStoreIds: Set<string>;
  samkaupSubChains?: boolean;
  onStoreChange: (storeId: string) => void;
  onValueChange: (productId: string, value: number) => void;
  onRemove: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const selectedStore = stores.find((s) => s.id === entry.storeId);
  const hasValues = Object.values(entry.values).some((v) => v > 0);
  const totalBoxes = Object.values(entry.values).reduce((sum, v) => sum + v, 0);

  const availableStores = stores.filter(
    (s) => s.id === entry.storeId || !usedStoreIds.has(s.id)
  );

  const groupedStores = samkaupSubChains
    ? availableStores.reduce<Record<string, Store[]>>((groups, store) => {
        const label = store.subChainId || "other";
        if (!groups[label]) groups[label] = [];
        groups[label].push(store);
        return groups;
      }, {})
    : null;

  return (
    <div className="border border-border rounded-xl bg-surface">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Select value={entry.storeId || undefined} onValueChange={onStoreChange}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Veldu útibú..." />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-60">
              {groupedStores
                ? Object.entries(groupedStores).map(([subChainId, subStores]) => (
                    <SelectGroup key={subChainId}>
                      <SelectLabel>{subChainLabels[subChainId] ?? "Annað"}</SelectLabel>
                      {subStores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))
                : availableStores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>

          {selectedStore && hasValues && (
            <span className="flex items-center gap-1 text-xs font-semibold text-primary">
              <Check className="h-3 w-3" />
              {totalBoxes} kassar
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {selectedStore && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRemove}
            className="hover:text-danger"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectedStore && !collapsed && (
        <div className="border-t border-border-light px-4 py-3">
          <div className="grid grid-cols-3 gap-3">
            {products.map((product) => (
              <div key={product.id}>
                <label className="mb-1 block text-xs text-text-dim">
                  {product.name}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={entry.values[product.id] || 0}
                  onChange={(e) =>
                    onValueChange(product.id, parseInt(e.target.value) || 0)
                  }
                  className="h-auto py-2"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ChainInputCard({
  chainName,
  color,
  logo,
  stores,
  entries,
  samkaupSubChains,
  onAddEntry,
  onRemoveEntry,
  onStoreChange,
  onValueChange,
}: {
  chainName: string;
  color: string;
  logo?: string;
  stores: Store[];
  entries: StoreEntry[];
  samkaupSubChains?: boolean;
  onAddEntry: () => void;
  onRemoveEntry: (index: number) => void;
  onStoreChange: (index: number, storeId: string) => void;
  onValueChange: (index: number, productId: string, value: number) => void;
}) {
  const usedStoreIds = new Set(entries.map((e) => e.storeId).filter(Boolean));
  const completedCount = entries.filter((e) =>
    e.storeId && Object.values(e.values).some((v) => v > 0)
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {logo ? (
              <Image src={logo} alt={chainName} width={20} height={20} className="h-5 w-5 object-contain" />
            ) : (
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
            <h3 className="text-sm font-semibold text-foreground">
              {chainName}
            </h3>
            {completedCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary-border/30">
                {completedCount} skráð
              </span>
            )}
          </div>
          <span className="text-xs text-text-dim">
            {stores.length} útibú í boði
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map((entry, index) => (
          <StoreEntryRow
            key={index}
            entry={entry}
            stores={stores}
            usedStoreIds={usedStoreIds}
            samkaupSubChains={samkaupSubChains}
            onStoreChange={(storeId) => onStoreChange(index, storeId)}
            onValueChange={(productId, value) =>
              onValueChange(index, productId, value)
            }
            onRemove={() => onRemoveEntry(index)}
          />
        ))}

        <Button
          variant="outline"
          onClick={onAddEntry}
          disabled={stores.length <= usedStoreIds.size}
          className="w-full border-dashed hover:border-primary hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          Bæta við útibúi
        </Button>
      </CardContent>
    </Card>
  );
}

export { emptyProductValues };
