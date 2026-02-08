"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import {
  ChainInputCard,
  emptyProductValues,
} from "@/components/input/chain-input-card";
import type { StoreEntry } from "@/components/input/chain-input-card";
import { chains, sampleStores } from "@/lib/data/chains";
import { Eraser, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  const totalEntries = Object.values(entries)
    .flat()
    .filter((e) => e.storeId && Object.values(e.values).some((v) => v > 0))
    .length;

  return (
    <div className="space-y-6">
      <PageHeader title="Skrá gögn" subtitle="Skrá daglega sölu eftir keðju og útibúi">
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
        <Button>
          <Save className="h-4 w-4" />
          Vista{totalEntries > 0 && ` (${totalEntries})`}
        </Button>
      </PageHeader>

      <div className="space-y-4">
        {inputChains.map((chain) => {
          const chainStores = sampleStores.filter(
            (s) => s.chainId === chain.id
          );
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
    </div>
  );
}
