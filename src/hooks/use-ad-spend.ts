"use client";

import { useState, useEffect } from "react";
import type { Period } from "@/components/ui/period-tabs";
import { createClient } from "@/lib/supabase/client";
import { getDateRange } from "@/lib/date-ranges";
import type { Database } from "@/lib/database.types";

type AdSpendRow = Database["public"]["Tables"]["daily_ad_spend"]["Row"];

export interface AdSpendData {
  meta: { spend: number; revenue: number; roas: number };
  google: { spend: number; revenue: number; roas: number };
  total: { spend: number; roas: number };
}

interface AdSpendResult {
  isLoading: boolean;
  data: AdSpendData;
  totalSpend: number;
}

const emptyAdSpend: AdSpendData = {
  meta: { spend: 0, revenue: 0, roas: 0 },
  google: { spend: 0, revenue: 0, roas: 0 },
  total: { spend: 0, roas: 0 },
};

export function useAdSpend(period: Period, totalRevenue: number): AdSpendResult {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AdSpendData>(emptyAdSpend);
  const [totalSpend, setTotalSpend] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchAdSpend() {
      setIsLoading(true);
      const supabase = createClient();
      const range = getDateRange(period);

      const { data: rows } = await supabase
        .from("daily_ad_spend")
        .select("platform, amount")
        .gte("date", range.from)
        .lte("date", range.to) as unknown as { data: Pick<AdSpendRow, "platform" | "amount">[] | null };

      if (cancelled) return;

      if (!rows || rows.length === 0) {
        setData(emptyAdSpend);
        setTotalSpend(0);
        setIsLoading(false);
        return;
      }

      // Aggregate by platform
      let metaSpend = 0;
      let googleSpend = 0;

      for (const row of rows) {
        if (row.platform === "meta") metaSpend += row.amount;
        else if (row.platform === "google") googleSpend += row.amount;
      }

      const total = metaSpend + googleSpend;
      const totalRoas = total > 0 ? Math.round((totalRevenue / total) * 10) / 10 : 0;

      // Estimate revenue split proportionally to spend
      const metaShare = total > 0 ? metaSpend / total : 0.5;
      const metaRevenue = Math.round(totalRevenue * metaShare);
      const googleRevenue = totalRevenue - metaRevenue;

      const result: AdSpendData = {
        meta: {
          spend: metaSpend,
          revenue: metaRevenue,
          roas: metaSpend > 0 ? Math.round((metaRevenue / metaSpend) * 10) / 10 : 0,
        },
        google: {
          spend: googleSpend,
          revenue: googleRevenue,
          roas: googleSpend > 0 ? Math.round((googleRevenue / googleSpend) * 10) / 10 : 0,
        },
        total: { spend: total, roas: totalRoas },
      };

      setData(result);
      setTotalSpend(total);
      setIsLoading(false);
    }

    fetchAdSpend();
    return () => { cancelled = true; };
  }, [period, totalRevenue]);

  return { isLoading, data, totalSpend };
}
