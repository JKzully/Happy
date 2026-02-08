"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DrillDownPanel } from "./drill-down-panel";
import type { StoreSale } from "@/lib/data/mock-sales";

const subTabs = [
  { id: "all", label: "Allt" },
  { id: "netto", label: "Nettó" },
  { id: "kjorbudir", label: "Kjörbuðir" },
  { id: "iceland", label: "Iceland" },
  { id: "extra", label: "Extra" },
  { id: "krambud", label: "Krambuð" },
];

export function SamkaupDrillDown({ stores }: { stores: StoreSale[] }) {
  const [activeTab, setActiveTab] = useState("all");

  const filtered =
    activeTab === "all"
      ? stores
      : stores.filter((s) => s.subChainId === activeTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="border-b border-border-light px-4 pt-3">
        <TabsList>
          {subTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <DrillDownPanel stores={filtered} />
    </Tabs>
  );
}
