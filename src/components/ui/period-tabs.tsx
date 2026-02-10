"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const periods = [
  { key: "yesterday", label: "Í gær" },
  { key: "week", label: "Þessi vika" },
  { key: "month", label: "Þessi mánuður" },
  { key: "30d", label: "30 dagar" },
  { key: "compare", label: "Samanburður" },
] as const;

export type Period = (typeof periods)[number]["key"];

export function PeriodTabs({
  active,
  onChange,
}: {
  active: Period;
  onChange: (period: Period) => void;
}) {
  return (
    <Tabs value={active} onValueChange={(v) => onChange(v as Period)}>
      <TabsList>
        {periods.map((p) => (
          <TabsTrigger key={p.key} value={p.key}>
            {p.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
