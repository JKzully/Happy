"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKr } from "@/lib/format";
import { costCategories, costHistory } from "@/lib/data/mock-costs";
import type { CostItem } from "@/lib/data/mock-costs";
import { Pencil, Save, Plus, X, Wifi } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const areaCategories = [
  { dataKey: "operations", name: "Rekstur", color: "#3B82F6" },
  { dataKey: "marketingFixed", name: "Markaðss. fast", color: "#22C55E" },
  { dataKey: "marketingVariable", name: "Markaðss. breyt.", color: "#F59E0B" },
  { dataKey: "adsDaily", name: "Meta + Google", color: "#EF4444" },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
function CostTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#18181B] px-4 py-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-[#A1A1AA]">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-6 py-0.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[11px] text-[#D4D4D8]">{entry.name}</span>
          </div>
          <span className="text-[11px] font-medium text-[#FAFAFA]">{formatKr(entry.value)}</span>
        </div>
      ))}
      <div className="mt-2 border-t border-[rgba(255,255,255,0.07)] pt-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#A1A1AA]">Samtals</span>
        <span className="text-[11px] font-bold text-[#FAFAFA]">{formatKr(total)}</span>
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function TotalCostChart() {
  const currentMonth = costHistory[costHistory.length - 1];
  const totalMonthly =
    currentMonth.operations +
    currentMonth.marketingFixed +
    currentMonth.marketingVariable +
    currentMonth.adsDaily;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
              Heildarkostnaður — 6 mánuðir
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {formatKr(totalMonthly)}
            </p>
          </div>
          <Badge variant="neutral">6 mánuðir</Badge>
        </div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={costHistory}>
              <defs>
                {areaCategories.map((cat) => (
                  <linearGradient key={cat.dataKey} id={`grad-${cat.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={cat.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={cat.color} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#71717A" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#71717A" }}
                tickFormatter={(v: number) =>
                  `${(v / 1000000).toFixed(1)}M`
                }
                width={45}
              />
              <Tooltip content={<CostTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "#A1A1AA" }}
              />
              {areaCategories.map((cat) => (
                <Area
                  key={cat.dataKey}
                  type="monotone"
                  dataKey={cat.dataKey}
                  name={cat.name}
                  stackId="1"
                  stroke={cat.color}
                  strokeWidth={2}
                  fill={`url(#grad-${cat.dataKey})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function EditableCostCard({
  id,
  title,
  items: initialItems,
  editable,
}: {
  id: string;
  title: string;
  items: CostItem[];
  editable: boolean;
}) {
  const [items, setItems] = useState<CostItem[]>(initialItems);
  const [editing, setEditing] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const isApi = !editable;

  const handleAmountChange = (index: number, value: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, amount: value } : item))
    );
  };

  const handleSave = () => {
    setEditing(false);
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    setItems((prev) => [...prev, { name: newItemName.trim(), amount: 0 }]);
    setNewItemName("");
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {isApi && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-light px-2 py-0.5 text-[10px] font-medium text-[#A78BFA] ring-1 ring-[rgba(167,139,250,0.2)]">
                <Wifi className="h-3 w-3" />
                Sjálfvirkt frá API
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              {formatKr(total)}
            </span>
            {editable && !editing && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {editable && editing && (
              <Button size="xs" onClick={handleSave}>
                <Save className="h-3 w-3" />
                Vista
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border-light">
          {items.map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              className="flex items-center justify-between px-5 py-3 transition-all duration-200 hover:bg-[rgba(255,255,255,0.06)]"
            >
              <span className="text-sm text-text-secondary">{item.name}</span>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={item.amount}
                    onChange={(e) =>
                      handleAmountChange(i, parseInt(e.target.value) || 0)
                    }
                    className="w-32 h-auto py-1 text-right font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleRemoveItem(i)}
                    className="hover:text-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : isApi ? (
                <span className="text-sm font-medium text-text-dim italic">
                  {formatKr(item.amount)}
                </span>
              ) : (
                <span className="text-sm font-medium text-foreground">
                  {formatKr(item.amount)}
                </span>
              )}
            </div>
          ))}
        </div>

        {isApi && (
          <div className="border-t border-border-light px-5 py-3">
            <p className="text-xs italic text-text-dim">
              Tengist API...
            </p>
          </div>
        )}

        {editable && editing && (
          <div className="border-t border-border-light px-5 py-3">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                placeholder="Nýr kostnaðarliður..."
                className="flex-1 h-auto py-1.5"
              />
              <Button variant="outline" size="xs" onClick={handleAddItem}>
                <Plus className="h-3.5 w-3.5" />
                Bæta við
              </Button>
            </div>
          </div>
        )}

        {editable && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex w-full items-center justify-center gap-1 border-t border-border-light py-2.5 text-xs font-medium text-text-dim transition-all duration-200 hover:bg-[rgba(255,255,255,0.06)] hover:text-text-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
            Bæta við lið
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export default function CostPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Kostnaður"
        subtitle="Yfirlit yfir fastan og breytilegan kostnað"
      />

      <TotalCostChart />

      <div className="grid grid-cols-2 gap-6">
        {costCategories.map((cat) => (
          <EditableCostCard
            key={cat.id}
            id={cat.id}
            title={cat.title}
            items={cat.items}
            editable={cat.editable}
          />
        ))}
      </div>
    </div>
  );
}
