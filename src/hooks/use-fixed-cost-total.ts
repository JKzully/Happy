"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Period } from "@/components/ui/period-tabs";
import { getDateRange, rangeDays } from "@/lib/date-ranges";

export function useFixedCostTotal(period: Period): number {
  const [fixedCosts, setFixedCosts] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const range = getDateRange(period);

      // Current month YYYY-MM
      const today = new Date();
      const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

      const { data: entries } = await supabase
        .from("monthly_cost_entries")
        .select("actual_amount")
        .eq("month", month);

      if (cancelled) return;

      const totalMonthly = (entries ?? []).reduce(
        (s, e: { actual_amount: number }) => s + (e.actual_amount ?? 0),
        0
      );

      // Pro-rate: monthly total × (period days / days in month)
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const periodDays = rangeDays(range);

      setFixedCosts(Math.round(totalMonthly * (periodDays / daysInMonth)));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [period]);

  return fixedCosts;
}
