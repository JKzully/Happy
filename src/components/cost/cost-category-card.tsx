"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKr } from "@/lib/format";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Save,
  Plus,
  X,
  Loader2,
  Trash2,
  CircleCheck,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CostCategoryWithEntries, CostEntryWithItem } from "@/hooks/use-cost-budget";

const PIE_COLORS = [
  "#3B82F6", "#22C55E", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
  "#6366F1", "#06B6D4",
];

/* eslint-disable @typescript-eslint/no-explicit-any */
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#18181B] px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.payload.fill }} />
        <span className="text-[11px] text-[#D4D4D8]">{d.name}</span>
      </div>
      <p className="mt-0.5 text-[11px] font-medium text-[#FAFAFA]">
        {formatKr(d.value)} ({d.payload.pct}%)
      </p>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface LocalEntry {
  costItemId: string;
  itemName: string;
  vskPercent: number;
  budgetAmount: number;
  actualAmount: number;
  isConfirmed: boolean;
  isNew?: boolean;
}

export function CostCategoryCard({
  category,
  isLocked,
  chartColor,
  showPieChart,
  onConfirmEntry,
  onSaveEntries,
  onAddItem,
  onDeleteItem,
  onDeleteCategory,
}: {
  category: CostCategoryWithEntries;
  isLocked: boolean;
  chartColor?: string;
  showPieChart?: boolean;
  onConfirmEntry: (costItemId: string, actualAmount: number, confirmed?: boolean) => Promise<void>;
  onSaveEntries: (entries: { costItemId: string; budgetAmount: number; actualAmount: number }[]) => Promise<void>;
  onAddItem: (categoryId: string, name: string, vskPercent?: number) => Promise<string>;
  onDeleteItem: (costItemId: string) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false); // structural edit mode (add/delete items)
  const [editingRow, setEditingRow] = useState<number | null>(null); // inline row edit
  const [saving, setSaving] = useState(false);
  const [confirmingRow, setConfirmingRow] = useState<number | null>(null);
  const [localEntries, setLocalEntries] = useState<LocalEntry[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemVsk, setNewItemVsk] = useState(0);

  // Sync from parent
  useEffect(() => {
    setLocalEntries(
      category.entries.map((e) => ({
        costItemId: e.costItemId,
        itemName: e.itemName,
        vskPercent: e.vskPercent,
        budgetAmount: e.budgetAmount,
        actualAmount: e.actualAmount,
        isConfirmed: e.isConfirmed,
      }))
    );
  }, [category.entries]);

  // Totals
  const budgetTotal = localEntries.reduce(
    (s, e) => s + e.budgetAmount * (1 + e.vskPercent / 100),
    0
  );
  const budgetTotalExVsk = localEntries.reduce(
    (s, e) => s + e.budgetAmount, 0
  );
  const actualTotal = localEntries.reduce(
    (s, e) => s + e.actualAmount * (1 + e.vskPercent / 100),
    0
  );
  const actualTotalExVsk = localEntries.reduce(
    (s, e) => s + e.actualAmount, 0
  );
  const diff = actualTotal - budgetTotal;
  const hasAnyVsk = localEntries.some((e) => e.vskPercent > 0);

  const handleFieldChange = (
    index: number,
    field: "budgetAmount" | "actualAmount",
    value: number
  ) => {
    setLocalEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // First, add any new items
      const newItems = localEntries.filter((e) => e.isNew);
      for (const item of newItems) {
        const newId = await onAddItem(category.id, item.itemName, item.vskPercent);
        item.costItemId = newId;
        item.isNew = false;
      }

      // Then save all entries
      await onSaveEntries(
        localEntries.map((e) => ({
          costItemId: e.costItemId,
          budgetAmount: e.budgetAmount,
          actualAmount: e.actualAmount,
        }))
      );
      setEditing(false);
    } catch {
      // toast handled by hook
    } finally {
      setSaving(false);
    }
  };

  const handleRowSave = async (index: number) => {
    setSaving(true);
    try {
      const entry = localEntries[index];
      await onSaveEntries([
        {
          costItemId: entry.costItemId,
          budgetAmount: entry.budgetAmount,
          actualAmount: entry.actualAmount,
        },
      ]);
      setEditingRow(null);
    } catch {
      // toast handled by hook
    } finally {
      setSaving(false);
    }
  };

  const handleRowCancel = (index: number) => {
    const original = category.entries[index];
    if (original) {
      setLocalEntries((prev) =>
        prev.map((e, i) =>
          i === index
            ? { ...e, budgetAmount: original.budgetAmount, actualAmount: original.actualAmount }
            : e
        )
      );
    }
    setEditingRow(null);
  };

  const handleConfirm = async (index: number) => {
    setConfirmingRow(index);
    try {
      const entry = localEntries[index];
      await onConfirmEntry(entry.costItemId, entry.actualAmount, true);
      setEditingRow(null);
    } catch {
      // toast handled by hook
    } finally {
      setConfirmingRow(null);
    }
  };

  const handleUnconfirm = async (index: number) => {
    setConfirmingRow(index);
    try {
      const entry = localEntries[index];
      await onConfirmEntry(entry.costItemId, entry.actualAmount, false);
    } catch {
      // toast handled by hook
    } finally {
      setConfirmingRow(null);
    }
  };

  const handleAddItem = () => {
    const name = newItemName.trim();
    if (!name) return;
    setLocalEntries((prev) => [
      ...prev,
      {
        costItemId: "", // will be assigned on save
        itemName: name,
        vskPercent: newItemVsk,
        budgetAmount: 0,
        actualAmount: 0,
        isConfirmed: false,
        isNew: true,
      },
    ]);
    setNewItemName("");
    setNewItemVsk(0);
  };

  const handleRemoveItem = async (index: number) => {
    const entry = localEntries[index];
    if (entry.isNew) {
      setLocalEntries((prev) => prev.filter((_, i) => i !== index));
    } else {
      if (!window.confirm(`Eyða "${entry.itemName}"?`)) return;
      await onDeleteItem(entry.costItemId);
    }
  };

  const handleDeleteCategory = () => {
    const count = category.entries.length;
    const msg = count > 0
      ? `Ertu viss? Flokkurinn "${category.name}" og ${count} liðir verða eyddir.`
      : `Eyða flokknum "${category.name}"?`;
    if (!window.confirm(msg)) return;
    onDeleteCategory(category.id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-left"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-text-dim" />
            ) : (
              <ChevronRight className="h-4 w-4 text-text-dim" />
            )}
            {chartColor && (
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: chartColor }}
              />
            )}
            <h3 className="text-sm font-semibold text-foreground">
              {category.name}
            </h3>
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-text-dim">
              <span>Áætlun: <span className="font-medium text-foreground">{formatKr(budgetTotal)}</span></span>
              {hasAnyVsk && <span className="ml-0.5 text-[10px]">({formatKr(budgetTotalExVsk)})</span>}
              <span className="mx-2">|</span>
              <span>Raun: <span className="font-medium text-foreground">{formatKr(actualTotal)}</span></span>
              {hasAnyVsk && <span className="ml-0.5 text-[10px]">({formatKr(actualTotalExVsk)})</span>}
              {diff !== 0 && (
                <>
                  <span className="mx-2">|</span>
                  <span className={diff > 0 ? "text-danger" : "text-primary"}>
                    {diff > 0 ? "+" : ""}{formatKr(diff)}
                  </span>
                </>
              )}
            </div>
            {!isLocked && !editing && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3 w-3" />
                Breyta
              </Button>
            )}
            {editing && (
              <div className="flex items-center gap-1">
                <Button size="xs" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  Vista
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setEditing(false);
                    setLocalEntries(
                      category.entries.map((e) => ({
                        costItemId: e.costItemId,
                        itemName: e.itemName,
                        vskPercent: e.vskPercent,
                        budgetAmount: e.budgetAmount,
                        actualAmount: e.actualAmount,
                        isConfirmed: e.isConfirmed,
                      }))
                    );
                  }}
                >
                  <X className="h-3 w-3" />
                  Hætta við
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleDeleteCategory}
                  className="ml-1 hover:text-danger"
                  title="Eyða flokki"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-0">
          {/* Pie chart */}
          {showPieChart && !editing && localEntries.length >= 2 && (() => {
            const pieData = localEntries
              .map((e) => ({
                name: e.itemName,
                value: e.actualAmount * (1 + e.vskPercent / 100),
              }))
              .filter((d) => d.value > 0)
              .sort((a, b) => b.value - a.value);
            const pieTotal = pieData.reduce((s, d) => s + d.value, 0);
            const withPct = pieData.map((d) => ({
              ...d,
              pct: pieTotal > 0 ? Math.round((d.value / pieTotal) * 100) : 0,
            }));

            return (
              <div className="flex items-center gap-4 border-b border-border-light px-5 py-4">
                <div className="h-32 w-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={withPct}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={55}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {withPct.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {withPct.map((d, idx) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="text-[11px] text-text-secondary">{d.name}</span>
                      <span className="text-[11px] font-medium text-text-dim">{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Header row */}
          <div className="grid grid-cols-[1fr_120px_120px_100px_80px] gap-2 border-b border-border-light px-5 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">
              Liður
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-dim text-right">
              Áætlun
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-dim text-right">
              Raun
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-dim text-right">
              Mismunur
            </span>
            <span />
          </div>

          {/* Items */}
          <div className="divide-y divide-border-light">
            {localEntries.map((entry, i) => {
              const budgetWithVsk = entry.budgetAmount * (1 + entry.vskPercent / 100);
              const actualWithVsk = entry.actualAmount * (1 + entry.vskPercent / 100);
              const variance = actualWithVsk - budgetWithVsk;
              const isStructuralEdit = editing && !isLocked;
              const isConfirming = confirmingRow === i;

              return (
                <div
                  key={entry.costItemId || `new-${i}`}
                  className={`group/row grid grid-cols-[1fr_120px_120px_100px_80px] gap-2 items-center px-5 py-2.5 transition-colors ${
                    entry.isConfirmed
                      ? "bg-primary/[0.03]"
                      : "hover:bg-[rgba(255,255,255,0.03)]"
                  }`}
                >
                  {/* Name */}
                  <div>
                    <span className={`text-sm ${entry.isConfirmed ? "text-foreground" : "text-text-secondary"}`}>
                      {entry.itemName}
                    </span>
                    {entry.vskPercent > 0 && (
                      <span className="ml-1.5 text-[10px] text-text-dim">
                        ({entry.vskPercent}% VSK)
                      </span>
                    )}
                  </div>

                  {/* Budget */}
                  {isStructuralEdit ? (
                    <Input
                      type="number"
                      value={entry.budgetAmount || ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        handleFieldChange(i, "budgetAmount", parseFloat(e.target.value) || 0)
                      }
                      className="h-7 text-right text-xs"
                    />
                  ) : (
                    <div className="text-right">
                      <div className="text-sm text-text-secondary">{formatKr(budgetWithVsk)}</div>
                      {entry.vskPercent > 0 && (
                        <div className="text-[10px] text-text-dim">{formatKr(entry.budgetAmount)}</div>
                      )}
                    </div>
                  )}

                  {/* Actual — editable inline if not confirmed and not locked */}
                  {isStructuralEdit ? (
                    <Input
                      type="number"
                      value={entry.actualAmount || ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        handleFieldChange(i, "actualAmount", parseFloat(e.target.value) || 0)
                      }
                      className="h-7 text-right text-xs"
                    />
                  ) : !entry.isConfirmed && !isLocked ? (
                    <div className="text-right">
                      <Input
                        type="number"
                        value={entry.actualAmount || ""}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          handleFieldChange(i, "actualAmount", parseFloat(e.target.value) || 0)
                        }
                        className="h-7 text-right text-xs"
                      />
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">{formatKr(actualWithVsk)}</div>
                      {entry.vskPercent > 0 && (
                        <div className="text-[10px] text-text-dim">{formatKr(entry.actualAmount)}</div>
                      )}
                    </div>
                  )}

                  {/* Variance — only shown when confirmed */}
                  <span
                    className={`text-sm text-right font-medium ${
                      !entry.isConfirmed
                        ? "text-text-dim/30"
                        : variance > 0
                          ? "text-danger"
                          : variance < 0
                            ? "text-primary"
                            : "text-text-dim"
                    }`}
                  >
                    {!entry.isConfirmed
                      ? "—"
                      : variance !== 0
                        ? `${variance > 0 ? "+" : ""}${formatKr(variance)}`
                        : "0 kr"}
                  </span>

                  {/* Confirm / status */}
                  {isStructuralEdit ? (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemoveItem(i)}
                      className="hover:text-danger justify-self-end"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  ) : entry.isConfirmed ? (
                    <button
                      onClick={() => handleUnconfirm(i)}
                      disabled={isLocked || isConfirming}
                      className="justify-self-end rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary-border/30 transition-opacity hover:opacity-70 cursor-pointer disabled:cursor-default disabled:opacity-100"
                      title="Af-staðfesta"
                    >
                      {isConfirming ? "..." : "Staðfest"}
                    </button>
                  ) : !isLocked ? (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleConfirm(i)}
                      disabled={isConfirming}
                      className="justify-self-end"
                    >
                      {isConfirming ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CircleCheck className="h-3 w-3" />
                      )}
                      Staðfesta
                    </Button>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
          </div>

          {/* Add item row (editing mode) */}
          {editing && !isLocked && (
            <div className="border-t border-border-light px-5 py-3">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                  placeholder="Nýr kostnaðarliður..."
                  className="flex-1 h-7 text-xs"
                />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-text-dim">VSK</span>
                  <Input
                    type="number"
                    value={newItemVsk || ""}
                    onChange={(e) => setNewItemVsk(parseFloat(e.target.value) || 0)}
                    className="w-14 h-7 text-right text-xs"
                    placeholder="0"
                  />
                  <span className="text-[10px] text-text-dim">%</span>
                </div>
                <Button variant="outline" size="xs" onClick={handleAddItem}>
                  <Plus className="h-3 w-3" />
                  Bæta við
                </Button>
              </div>
            </div>
          )}

          {/* Empty state hint */}
          {!editing && !isLocked && localEntries.length === 0 && (
            <div className="border-t border-border-light px-5 py-3">
              <p className="text-center text-xs text-text-dim">
                Engir liðir — smelltu á &quot;Breyta&quot; til að bæta við
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
