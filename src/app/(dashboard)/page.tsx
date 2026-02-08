"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PeriodTabs, type Period } from "@/components/ui/period-tabs";
import { SummaryBar } from "@/components/dashboard/summary-bar";
import { BenchmarkBar } from "@/components/dashboard/benchmark-bar";
import { AlertsCard } from "@/components/dashboard/alerts-card";
import { ChannelCard } from "@/components/dashboard/channel-card";
import { DrillDownPanel } from "@/components/dashboard/drill-down-panel";
import { SamkaupDrillDown } from "@/components/dashboard/samkaup-drill-down";
import { ShopifyDrillDown } from "@/components/dashboard/shopify-drill-down";
import { AdSpendSection } from "@/components/dashboard/ad-spend-section";
import { MonthlyProgress } from "@/components/dashboard/monthly-progress";
import { DeadStoresCard } from "@/components/dashboard/dead-stores";
import { chains } from "@/lib/data/chains";
import {
  channelSalesToday,
  totalRevenue,
  totalAdSpend,
  totalMargin,
  avg30d,
  alerts,
  kronanDrillDown,
  samkaupDrillDown,
  bonusDrillDown,
  hagkaupDrillDown,
  shopifyDrillDown,
  adSpendBreakdown,
  monthlyProgress,
  deadStores,
} from "@/lib/data/mock-sales";
import Link from "next/link";
import { ClipboardEdit } from "lucide-react";
import { Button } from "@/components/ui/button";

const drillDownMap: Record<string, React.ReactNode> = {
  kronan: <DrillDownPanel stores={kronanDrillDown} />,
  samkaup: <SamkaupDrillDown stores={samkaupDrillDown} />,
  bonus: <DrillDownPanel stores={bonusDrillDown} />,
  hagkaup: <DrillDownPanel stores={hagkaupDrillDown} />,
  shopify: (
    <ShopifyDrillDown
      stakKaup={shopifyDrillDown.stakKaup}
      askrift={shopifyDrillDown.askrift}
    />
  ),
};

function channelLabel(chainId: string): string {
  if (chainId === "n1") return "Aðrir / N1";
  return chains.find((c) => c.id === chainId)?.name ?? chainId;
}

export default function SolurPage() {
  const [activePeriod, setActivePeriod] = useState<Period>("today");
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const toggleChannel = (id: string) => {
    setExpandedChannel((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Sölur" subtitle="Söluyfirlit yfir allar rásir">
        <PeriodTabs active={activePeriod} onChange={setActivePeriod} />
        <Button asChild>
          <Link href="/input">
            <ClipboardEdit className="h-4 w-4" />
            Skrá sölu
          </Link>
        </Button>
      </PageHeader>

      <SummaryBar
        revenue={totalRevenue}
        adSpend={totalAdSpend}
        margin={totalMargin}
      />

      <BenchmarkBar
        avgRevenue={avg30d.revenue}
        avgAdSpend={avg30d.adSpend}
        avgBoxes={avg30d.boxes}
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <AlertsCard alerts={alerts} />

          <div className="grid grid-cols-3 gap-3">
            {channelSalesToday.map((ch) => {
              const chain = chains.find((c) => c.id === ch.chainId);
              if (!chain) return null;
              return (
                <ChannelCard
                  key={ch.chainId}
                  name={channelLabel(ch.chainId)}
                  boxes={ch.boxes}
                  revenue={ch.revenue}
                  trend={ch.trend}
                  color={chain.color}
                  logo={chain.logo}
                  isExpanded={expandedChannel === ch.chainId}
                  onClick={() => toggleChannel(ch.chainId)}
                />
              );
            })}
          </div>

          {expandedChannel && drillDownMap[expandedChannel] && (
            <div className="animate-fade-in rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="border-b border-border-light bg-surface-elevated/50 px-5 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {channelLabel(expandedChannel)} - Sundurliðun
                </h3>
              </div>
              {drillDownMap[expandedChannel]}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <AdSpendSection
            meta={adSpendBreakdown.meta}
            google={adSpendBreakdown.google}
            total={adSpendBreakdown.total}
          />
          <MonthlyProgress {...monthlyProgress} />
          <DeadStoresCard stores={deadStores} />
        </div>
      </div>
    </div>
  );
}
