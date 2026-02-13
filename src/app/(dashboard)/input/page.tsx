"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ChainReviewCard } from "@/components/input/chain-review-card";
import { chains } from "@/lib/data/chains";
import { Loader2, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExcelUpload } from "@/components/input/excel-upload";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { downloadSalesBackup } from "@/lib/excel/export-sales";
import type { Database } from "@/lib/database.types";

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const months = ["janúar", "febrúar", "mars", "apríl", "maí", "júní", "júlí", "ágúst", "september", "október", "nóvember", "desember"];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

type ChainRow = Database["public"]["Tables"]["retail_chains"]["Row"];

const reviewChains = chains.filter(
  (c) => c.id !== "shopify" && c.id !== "n1"
);

export default function InputPage() {
  const [selectedDate, setSelectedDate] = useState(yesterday);
  const [downloading, setDownloading] = useState(false);
  const [chainSlugToUuid, setChainSlugToUuid] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    setSelectedDate(formatDate(d));
  };

  // Fetch chain slug → UUID map
  useEffect(() => {
    async function fetchChains() {
      const supabase = createClient();
      const { data } = (await supabase
        .from("retail_chains")
        .select()) as unknown as { data: ChainRow[] | null };

      const map: Record<string, string> = {};
      if (data) {
        for (const c of data) {
          map[c.slug] = c.id;
        }
      }
      setChainSlugToUuid(map);
      setLoading(false);
    }
    fetchChains();
  }, []);

  const handleBackup = async () => {
    setDownloading(true);
    try {
      const count = await downloadSalesBackup();
      toast.success(`${count} sölufærslur sóttar sem Excel backup`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Villa við niðurhal");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skrá gögn"
        subtitle="Hlaða upp söluskýrslum og skoða skráð gögn"
      >
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-elevated/60 px-1 py-0.5">
          <Button variant="ghost" size="icon-xs" onClick={() => shiftDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center text-sm font-medium text-foreground">
            {formatDateLabel(selectedDate)}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => shiftDate(1)}
            disabled={selectedDate >= formatDate(new Date())}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={handleBackup}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {downloading ? "Sæki..." : "Sækja backup"}
        </Button>
      </PageHeader>

      <ExcelUpload />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-text-dim" />
          <span className="ml-3 text-sm text-text-dim">Sæki keðjur...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewChains.map((chain) => (
            <ChainReviewCard
              key={chain.id}
              chainName={chain.name}
              color={chain.color}
              logo={chain.logo}
              chainUuid={chainSlugToUuid[chain.id] || ""}
              defaultDate={selectedDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
