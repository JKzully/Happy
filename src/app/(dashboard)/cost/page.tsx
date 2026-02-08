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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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
              Heildarkostnaður á mánuði
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {formatKr(totalMonthly)}
            </p>
          </div>
          <Badge variant="neutral">6 mánuðir</Badge>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costHistory} barCategoryGap="20%">
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
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip
                formatter={(value: any) => formatKr(Number(value))}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.07)",
                  backgroundColor: "#18181B",
                  color: "#FAFAFA",
                }}
                labelStyle={{ color: "#A1A1AA" }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "#A1A1AA" }}
              />
              <Bar
                dataKey="operations"
                name="Rekstur"
                stackId="a"
                fill="#60A5FA"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="marketingFixed"
                name="Markaðss. fast"
                stackId="a"
                fill="#34D399"
              />
              <Bar
                dataKey="marketingVariable"
                name="Markaðss. breyt."
                stackId="a"
                fill="#FBBF24"
              />
              <Bar
                dataKey="adsDaily"
                name="Meta + Google"
                stackId="a"
                fill="#FB7185"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
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
              className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
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
            className="flex w-full items-center justify-center gap-1 border-t border-border-light py-2.5 text-xs font-medium text-text-dim transition-colors hover:bg-[rgba(255,255,255,0.02)] hover:text-text-secondary"
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

      <div className="grid grid-cols-2 gap-4">
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
