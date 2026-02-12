"use client";

import { useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PeriodTabs, type Period } from "@/components/ui/period-tabs";
import { SummaryBar } from "@/components/dashboard/summary-bar";
import { ChannelCard } from "@/components/dashboard/channel-card";
import { DrillDownPanel } from "@/components/dashboard/drill-down-panel";
import { SamkaupDrillDown } from "@/components/dashboard/samkaup-drill-down";
import { ShopifyDrillDown } from "@/components/dashboard/shopify-drill-down";
import { NotificationCard, type Alert } from "@/components/dashboard/notification-card";
import { AdDonutCard } from "@/components/dashboard/ad-donut-card";
import { CompareView } from "@/components/dashboard/compare-view";
import { chains } from "@/lib/data/chains";
import { usePeriodSales } from "@/hooks/use-period-sales";
import { useAdSpend } from "@/hooks/use-ad-spend";
import Link from "next/link";
import { ClipboardEdit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function channelLabel(chainId: string): string {
  if (chainId === "n1") return "Aðrir / N1";
  return chains.find((c) => c.id === chainId)?.name ?? chainId;
}

export default function SolurPage() {
  const [activePeriod, setActivePeriod] = useState<Period>("yesterday");
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const { isLoading, channels, totalRevenue, totalCogs, lastYearRevenue, shopifyTodayBoxes, shopifyBreakdown, drillDown, refetch } =
    usePeriodSales(activePeriod);
  const { data: adData, totalSpend } = useAdSpend(activePeriod, totalRevenue);

  const drillDownMap: Record<string, React.ReactNode> = {
    kronan: <DrillDownPanel stores={drillDown.kronan ?? []} />,
    samkaup: <SamkaupDrillDown stores={drillDown.samkaup ?? []} />,
    bonus: <DrillDownPanel stores={drillDown.bonus ?? []} />,
    hagkaup: <DrillDownPanel stores={drillDown.hagkaup ?? []} />,
    ...(shopifyBreakdown
      ? {
          shopify: (
            <ShopifyDrillDown
              stakKaup={shopifyBreakdown.oneTime}
              askrift={shopifyBreakdown.subscription}
            />
          ),
        }
      : {}),
  };

  const toggleChannel = (id: string) => {
    setExpandedChannel((prev) => (prev === id ? null : id));
  };

  // Build real alerts from drill-down data
  const realAlerts = useMemo<Alert[]>(() => {
    const items: Alert[] = [];
    const daysRegex = /^(\d+) dögum síðan$/;
    for (const [chainSlug, stores] of Object.entries(drillDown)) {
      if (chainSlug === "shopify") continue;
      const chainName = channelLabel(chainSlug);
      for (const store of stores) {
        const match = store.lastSale.match(daysRegex);
        if (!match) continue;
        const days = parseInt(match[1], 10);
        if (days >= 7) {
          items.push({
            type: days >= 10 ? "danger" : "warning",
            message: `${chainName} ${store.storeName}: Engin sala í ${days} daga`,
          });
        }
      }
    }
    // Sort worst first
    items.sort((a, b) => (a.type === "danger" ? 0 : 1) - (b.type === "danger" ? 0 : 1));
    return items;
  }, [drillDown]);

  const handleShopifySync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/shopify/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        console.error("Shopify sync failed:", data.error);
      } else {
        refetch();
      }
    } catch (err) {
      console.error("Shopify sync error:", err);
    } finally {
      setSyncing(false);
    }
  }, [refetch]);

  return (
    <div className="space-y-6">
      <PageHeader title="Sölur" subtitle="Söluyfirlit yfir allar rásir">
        <PeriodTabs active={activePeriod} onChange={setActivePeriod} />
        <Button
          variant="outline"
          onClick={handleShopifySync}
          disabled={syncing}
        >
          <RefreshCw
            className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Samstilli..." : "Samstilla Shopify"}
        </Button>
        <Button asChild>
          <Link href="/input">
            <ClipboardEdit className="h-4 w-4" />
            Skrá sölu
          </Link>
        </Button>
      </PageHeader>

      {activePeriod === "compare" ? (
        <CompareView />
      ) : (
        <div
          className={`transition-opacity duration-300 space-y-6 ${
            isLoading ? "opacity-60" : "opacity-100"
          }`}
        >
          <SummaryBar
            revenue={totalRevenue}
            cogs={totalCogs}
            adSpend={totalSpend}
          />

          <div className="grid grid-cols-3 gap-6">
            {channels.map((ch) => {
              const chain = chains.find((c) => c.id === ch.chainId);
              if (!chain) return null;
              return (
                <ChannelCard
                  key={ch.chainId}
                  name={channelLabel(ch.chainId)}
                  boxes={ch.boxes}
                  revenue={ch.revenue}
                  avg30dRevenue={ch.avg30dRevenue}
                  lastDataDate={ch.lastDataDate}
                  hasData={ch.hasData}
                  shopifyTodayBoxes={ch.chainId === "shopify" ? shopifyTodayBoxes : undefined}
                  categoryBoxes={ch.categoryBoxes}
                  color={chain.color}
                  logo={chain.logo}
                  isExpanded={expandedChannel === ch.chainId}
                  onClick={() => toggleChannel(ch.chainId)}
                />
              );
            })}
          </div>

          {expandedChannel && drillDownMap[expandedChannel] && (
            <div className="animate-fade-in rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] overflow-hidden">
              <div className="border-b border-border-light bg-surface-elevated/50 px-5 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {channelLabel(expandedChannel)} - Sundurliðun
                </h3>
              </div>
              {drillDownMap[expandedChannel]}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <NotificationCard alerts={realAlerts} />
            <AdDonutCard data={adData} />
          </div>
        </div>
      )}
    </div>
  );
}
