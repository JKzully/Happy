"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface SalesRow {
  storeName: string;
  productName: string;
  quantity: number;
}

export function ChainReviewCard({
  chainName,
  color,
  logo,
  chainUuid,
  defaultDate,
}: {
  chainName: string;
  color: string;
  logo?: string;
  chainUuid: string;
  defaultDate?: string;
}) {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<SalesRow[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Fetch available dates for this chain
  useEffect(() => {
    if (!chainUuid) return;

    async function fetchDates() {
      const supabase = createClient();

      // Fetch all dates that have data for this chain
      const allDates: string[] = [];
      const pageSize = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("daily_sales")
          .select("date, stores!inner(chain_id)")
          .eq("stores.chain_id", chainUuid)
          .range(offset, offset + pageSize - 1);

        if (error || !data || data.length === 0) {
          hasMore = false;
          break;
        }

        for (const row of data) {
          allDates.push((row as unknown as { date: string }).date);
        }

        if (data.length < pageSize) {
          hasMore = false;
        } else {
          offset += pageSize;
        }
      }

      const unique = [...new Set(allDates)].sort().reverse();
      setAvailableDates(unique);
      // Auto-select defaultDate if it exists in the data
      if (defaultDate && unique.includes(defaultDate)) {
        setSelectedDate(defaultDate);
        setExpanded(true);
      }
      setLoadingDates(false);
    }

    fetchDates();
  }, [chainUuid, defaultDate]);

  // Fetch sales data when date is selected
  useEffect(() => {
    if (!selectedDate || !chainUuid) return;

    async function fetchSales() {
      setLoadingData(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("daily_sales")
        .select(
          "quantity, stores!inner(name, chain_id), products!inner(name)"
        )
        .eq("stores.chain_id", chainUuid)
        .eq("date", selectedDate!);

      if (error) {
        console.error(error);
        setLoadingData(false);
        return;
      }

      const rows: SalesRow[] = (
        data as unknown as Array<{
          quantity: number;
          stores: { name: string };
          products: { name: string };
        }>
      ).map((r) => ({
        storeName: r.stores.name,
        productName: r.products.name,
        quantity: r.quantity,
      }));

      // Sort by store → product
      rows.sort(
        (a, b) =>
          a.storeName.localeCompare(b.storeName, "is") ||
          a.productName.localeCompare(b.productName, "is")
      );

      setSalesData(rows);
      setLoadingData(false);
    }

    fetchSales();
  }, [selectedDate, chainUuid]);

  const totalBoxes = salesData.reduce((sum, r) => sum + r.quantity, 0);
  const storeCount = new Set(salesData.map((r) => r.storeName)).size;

  // Group by store for display
  const groupedByStore = salesData.reduce<Record<string, SalesRow[]>>(
    (acc, row) => {
      if (!acc[row.storeName]) acc[row.storeName] = [];
      acc[row.storeName].push(row);
      return acc;
    },
    {}
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {logo ? (
              <Image
                src={logo}
                alt={chainName}
                width={20}
                height={20}
                className="h-5 w-5 object-contain"
              />
            ) : (
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
            <h3 className="text-sm font-semibold text-foreground">
              {chainName}
            </h3>
            {selectedDate && salesData.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary-border/30">
                {totalBoxes} kassar &middot; {storeCount} útibú
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {loadingDates ? (
              <Loader2 className="h-4 w-4 animate-spin text-text-dim" />
            ) : (
              <Select
                value={selectedDate ?? undefined}
                onValueChange={(val) => {
                  setSelectedDate(val);
                  setExpanded(true);
                }}
              >
                <SelectTrigger className="min-w-[160px]">
                  <SelectValue
                    placeholder={
                      availableDates.length === 0
                        ? "Engin gögn"
                        : "Veldu dagsetningu..."
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60">
                  {availableDates.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedDate && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {selectedDate && expanded && (
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-text-dim" />
              <span className="ml-2 text-sm text-text-dim">Sæki gögn...</span>
            </div>
          ) : salesData.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-dim">
              Engin gögn skráð á þessari dagsetningu
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedByStore).map(([storeName, rows]) => {
                const storeTotal = rows.reduce((s, r) => s + r.quantity, 0);
                return (
                  <div
                    key={storeName}
                    className="rounded-xl border border-border bg-surface"
                  >
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm font-medium text-foreground">
                        {storeName}
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        {storeTotal} kassar
                      </span>
                    </div>
                    <div className="border-t border-border-light px-4 py-2.5">
                      <div className="grid grid-cols-3 gap-2">
                        {rows.map((r) => (
                          <div
                            key={r.productName}
                            className="flex items-center justify-between rounded-lg bg-surface-raised px-3 py-1.5"
                          >
                            <span className="text-xs text-text-dim">
                              {r.productName}
                            </span>
                            <span className="text-xs font-semibold text-foreground">
                              {r.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
