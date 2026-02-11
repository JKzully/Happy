"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PeriodTabs, type Period } from "@/components/ui/period-tabs";
import { SummaryBar } from "@/components/dashboard/summary-bar";
import { ChannelCard } from "@/components/dashboard/channel-card";
import { DrillDownPanel } from "@/components/dashboard/drill-down-panel";
import { SamkaupDrillDown } from "@/components/dashboard/samkaup-drill-down";
import { ShopifyDrillDown } from "@/components/dashboard/shopify-drill-down";
import { NotificationCard } from "@/components/dashboard/notification-card";
import { AdDonutCard } from "@/components/dashboard/ad-donut-card";
import { CompareView } from "@/components/dashboard/compare-view";
import { chains } from "@/lib/data/chains";
import { alerts, deadStores } from "@/lib/data/mock-sales";
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

  const { isLoading, channels, totalRevenue, lastYearRevenue, shopifyTodayBoxes, shopifyBreakdown, drillDown } =
    usePeriodSales(activePeriod);
  const { data: adData, totalSpend } = useAdSpend(activePeriod, totalRevenue);
  const totalMargin = totalRevenue - totalSpend;

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

  const handleShopifySync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/shopify/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        console.error("Shopify sync failed:", data.error);
      }
    } catch (err) {
      console.error("Shopify sync error:", err);
    } finally {
      setSyncing(false);
    }
  }, []);

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
            adSpend={totalSpend}
            margin={totalMargin}
            lastYearRevenue={lastYearRevenue}
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
                  trend={ch.trend}
                  avg30dRevenue={ch.avg30dRevenue}
                  lastYearRevenue={ch.lastYearRevenue}
                  hasData={ch.hasData}
                  shopifyTodayBoxes={ch.chainId === "shopify" ? shopifyTodayBoxes : undefined}
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
            <NotificationCard alerts={alerts} deadStores={deadStores} />
            <AdDonutCard data={adData} />
          </div>
        </div>
      )}
    </div>
  );
}
