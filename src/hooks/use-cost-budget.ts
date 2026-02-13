"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { toast } from "sonner";

type CostCategoryRow = Database["public"]["Tables"]["cost_categories"]["Row"];
type CostItemRow = Database["public"]["Tables"]["cost_items"]["Row"];
type MonthlyEntryRow = Database["public"]["Tables"]["monthly_cost_entries"]["Row"];
type MonthlyLockRow = Database["public"]["Tables"]["monthly_cost_locks"]["Row"];

export interface CostEntryWithItem {
  entryId: string | null; // null if not yet persisted
  costItemId: string;
  itemName: string;
  vskPercent: number;
  budgetAmount: number;
  actualAmount: number;
  isConfirmed: boolean;
}

export interface CostCategoryWithEntries {
  id: string;
  name: string;
  sortOrder: number;
  entries: CostEntryWithItem[];
}

export interface CostBudgetData {
  categories: CostCategoryWithEntries[];
  isLocked: boolean;
  lockInfo: MonthlyLockRow | null;
  isLoading: boolean;
  month: string; // "YYYY-MM"
  adSpendTotal: number;
  // Mutations
  confirmEntry: (costItemId: string, actualAmount: number, confirmed?: boolean) => Promise<void>;
  saveEntries: (entries: { costItemId: string; budgetAmount: number; actualAmount: number }[]) => Promise<void>;
  addCategory: (name: string) => Promise<string>;
  deleteCategory: (categoryId: string) => Promise<void>;
  renameCategory: (categoryId: string, name: string) => Promise<void>;
  addCostItem: (categoryId: string, name: string, vskPercent?: number) => Promise<string>;
  deleteCostItem: (costItemId: string) => Promise<void>;
  lockMonth: () => Promise<void>;
  unlockMonth: () => Promise<void>;
  reload: () => Promise<void>;
}

function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1); // m-1 is current month index, m-2 is previous
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function useCostBudget(month: string): CostBudgetData {
  const [categories, setCategories] = useState<CostCategoryWithEntries[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockInfo, setLockInfo] = useState<MonthlyLockRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adSpendTotal, setAdSpendTotal] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      // Fetch all data in parallel
      const [catsRes, itemsRes, entriesRes, lockRes, adRes] = await Promise.all([
        supabase.from("cost_categories").select().order("sort_order") as unknown as { data: CostCategoryRow[] | null; error: unknown },
        supabase.from("cost_items").select().order("sort_order") as unknown as { data: CostItemRow[] | null; error: unknown },
        supabase.from("monthly_cost_entries").select().eq("month", month) as unknown as { data: MonthlyEntryRow[] | null; error: unknown },
        supabase.from("monthly_cost_locks").select().eq("month", month).maybeSingle() as unknown as { data: MonthlyLockRow | null; error: unknown },
        supabase.from("daily_ad_spend").select("amount").gte("date", `${month}-01`).lt("date", month === "2099-12" ? "2100-01-01" : (() => {
          const [y, m] = month.split("-").map(Number);
          const next = new Date(y, m, 1);
          return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
        })()) as unknown as { data: { amount: number }[] | null; error: unknown },
      ]);

      const cats = catsRes.data ?? [];
      const items = itemsRes.data ?? [];
      let entries = entriesRes.data ?? [];
      const lock = lockRes.data;
      const adRows = adRes.data ?? [];

      setIsLocked(!!lock);
      setLockInfo(lock);
      setAdSpendTotal(adRows.reduce((s, r) => s + r.amount, 0));

      // If no entries exist for this month, auto-copy from previous month
      if (entries.length === 0 && items.length > 0) {
        const prev = prevMonth(month);
        const { data: prevEntries } = await supabase
          .from("monthly_cost_entries")
          .select()
          .eq("month", prev) as unknown as { data: MonthlyEntryRow[] | null };

        const prevMap = new Map((prevEntries ?? []).map(e => [e.cost_item_id, e]));

        // Create entries: budget = previous actual, actual = budget (follows budget until updated)
        const newEntries = items.map(item => {
          const prevEntry = prevMap.get(item.id);
          const budgetAmt = prevEntry ? prevEntry.actual_amount : 0;
          return {
            cost_item_id: item.id,
            month,
            budget_amount: budgetAmt,
            actual_amount: budgetAmt,
          };
        });

        if (newEntries.length > 0) {
          const { data: inserted } = await (supabase
            .from("monthly_cost_entries") as ReturnType<typeof supabase.from>)
            .insert(newEntries)
            .select() as unknown as { data: MonthlyEntryRow[] | null };

          entries = inserted ?? [];
        }
      }

      // Auto-fill: if actual is 0 but budget > 0 and month is not locked, set actual = budget
      if (!lock) {
        const toFix = entries.filter(e => e.actual_amount === 0 && e.budget_amount > 0);
        if (toFix.length > 0) {
          for (const entry of toFix) {
            await (supabase
              .from("monthly_cost_entries") as ReturnType<typeof supabase.from>)
              .update({ actual_amount: entry.budget_amount })
              .eq("id", entry.id);
            entry.actual_amount = entry.budget_amount;
          }
        }
      }

      // Build the entries map: costItemId → entry
      const entryMap = new Map(entries.map(e => [e.cost_item_id, e]));

      // Build category tree
      const result: CostCategoryWithEntries[] = cats.map(cat => {
        const catItems = items.filter(i => i.category_id === cat.id);
        return {
          id: cat.id,
          name: cat.name,
          sortOrder: cat.sort_order,
          entries: catItems.map(item => {
            const entry = entryMap.get(item.id);
            return {
              entryId: entry?.id ?? null,
              costItemId: item.id,
              itemName: item.name,
              vskPercent: item.vsk_percent,
              budgetAmount: entry?.budget_amount ?? 0,
              actualAmount: entry?.actual_amount ?? 0,
              isConfirmed: entry?.is_confirmed ?? false,
            };
          }),
        };
      });

      setCategories(result);
    } catch (err) {
      console.error("Error loading cost budget data:", err);
      toast.error("Villa við að sækja kostnaðargögn");
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const confirmEntry = useCallback(async (costItemId: string, actualAmount: number, confirmed = true) => {
    const supabase = createClient();
    try {
      const { error } = await (supabase
        .from("monthly_cost_entries") as ReturnType<typeof supabase.from>)
        .upsert(
          {
            cost_item_id: costItemId,
            month,
            actual_amount: actualAmount,
            is_confirmed: confirmed,
          },
          { onConflict: "cost_item_id,month" }
        );
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error("Confirm entry error:", err);
      toast.error("Villa við staðfestingu");
      throw err;
    }
  }, [month, loadData]);

  const saveEntries = useCallback(async (updates: { costItemId: string; budgetAmount: number; actualAmount: number }[]) => {
    const supabase = createClient();
    try {
      for (const u of updates) {
        const { error } = await (supabase
          .from("monthly_cost_entries") as ReturnType<typeof supabase.from>)
          .upsert(
            {
              cost_item_id: u.costItemId,
              month,
              budget_amount: u.budgetAmount,
              actual_amount: u.actualAmount,
            },
            { onConflict: "cost_item_id,month" }
          );
        if (error) throw error;
      }
      toast.success("Kostnaður vistaður");
      await loadData();
    } catch (err) {
      console.error("Save entries error:", err);
      toast.error("Villa við vistun");
      throw err;
    }
  }, [month, loadData]);

  const addCategory = useCallback(async (name: string): Promise<string> => {
    const supabase = createClient();
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sortOrder), 0);
    const { data, error } = await (supabase
      .from("cost_categories") as ReturnType<typeof supabase.from>)
      .insert({ name, sort_order: maxOrder + 1 })
      .select()
      .single() as unknown as { data: CostCategoryRow | null; error: unknown };
    if (error || !data) {
      toast.error("Villa við að bæta við flokki");
      throw error;
    }
    toast.success(`Flokkur "${name}" bætt við`);
    await loadData();
    return data.id;
  }, [categories, loadData]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    const supabase = createClient();
    const { error } = await (supabase
      .from("cost_categories") as ReturnType<typeof supabase.from>)
      .delete()
      .eq("id", categoryId);
    if (error) {
      toast.error("Villa við að eyða flokki");
      throw error;
    }
    toast.success("Flokki eytt");
    await loadData();
  }, [loadData]);

  const renameCategory = useCallback(async (categoryId: string, name: string) => {
    const supabase = createClient();
    const { error } = await (supabase
      .from("cost_categories") as ReturnType<typeof supabase.from>)
      .update({ name })
      .eq("id", categoryId);
    if (error) {
      toast.error("Villa við að endurnefna flokk");
      throw error;
    }
    await loadData();
  }, [loadData]);

  const addCostItem = useCallback(async (categoryId: string, name: string, vskPercent = 0): Promise<string> => {
    const supabase = createClient();
    const cat = categories.find(c => c.id === categoryId);
    const maxOrder = cat ? cat.entries.reduce((max, e) => {
      // We need to get sort_order from the cost_items table, but we can approximate
      return max + 1;
    }, cat.entries.length) : 0;

    const { data, error } = await (supabase
      .from("cost_items") as ReturnType<typeof supabase.from>)
      .insert({ category_id: categoryId, name, vsk_percent: vskPercent, sort_order: maxOrder })
      .select()
      .single() as unknown as { data: CostItemRow | null; error: unknown };
    if (error || !data) {
      toast.error("Villa við að bæta við lið");
      throw error;
    }

    // Also create an entry for the current month
    await (supabase
      .from("monthly_cost_entries") as ReturnType<typeof supabase.from>)
      .insert({ cost_item_id: data.id, month, budget_amount: 0, actual_amount: 0 });

    await loadData();
    return data.id;
  }, [categories, month, loadData]);

  const deleteCostItem = useCallback(async (costItemId: string) => {
    const supabase = createClient();
    const { error } = await (supabase
      .from("cost_items") as ReturnType<typeof supabase.from>)
      .delete()
      .eq("id", costItemId);
    if (error) {
      toast.error("Villa við að eyða lið");
      throw error;
    }
    await loadData();
  }, [loadData]);

  const lockMonth = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase
      .from("monthly_cost_locks") as ReturnType<typeof supabase.from>)
      .insert({ month, locked_by: user?.id ?? null });
    if (error) {
      toast.error("Villa við að læsa mánuði");
      throw error;
    }
    toast.success("Mánuður staðfestur");
    await loadData();
  }, [month, loadData]);

  const unlockMonth = useCallback(async () => {
    const supabase = createClient();
    const { error } = await (supabase
      .from("monthly_cost_locks") as ReturnType<typeof supabase.from>)
      .delete()
      .eq("month", month);
    if (error) {
      toast.error("Villa við að opna mánuð");
      throw error;
    }
    toast.success("Mánuður opnaður");
    await loadData();
  }, [month, loadData]);

  return {
    categories,
    isLocked,
    lockInfo,
    isLoading,
    month,
    adSpendTotal,
    confirmEntry,
    saveEntries,
    addCategory,
    deleteCategory,
    renameCategory,
    addCostItem,
    deleteCostItem,
    lockMonth,
    unlockMonth,
    reload: loadData,
  };
}
