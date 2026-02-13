"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatKr } from "@/lib/format";

interface AdSpendBreakdown {
  meta: { spend: number; revenue: number; roas: number };
  google: { spend: number; revenue: number; roas: number };
  total: { spend: number; roas: number };
}

// Note: ROAS fields kept in interface for backwards compatibility but not displayed

const COLORS = {
  meta: "#3B82F6",
  google: "#F59E0B",
};

function PlatformCard({
  color,
  name,
  spend,
  percent,
}: {
  color: string;
  name: string;
  spend: number;
  percent: number;
}) {
  return (
    <div
      className="rounded-xl border border-border-light bg-surface-elevated/50 py-3 pr-3.5 pl-3.5"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-foreground">{name}</span>
        <span className="ml-auto text-[10px] font-medium text-text-dim">
          {percent}%
        </span>
      </div>
      <p className="mt-1.5 text-sm font-bold tabular-nums text-foreground">
        {formatKr(spend)}
      </p>
    </div>
  );
}

export function AdDonutCard({ data }: { data: AdSpendBreakdown }) {
  const chartData = [
    { name: "Meta", value: data.meta.spend },
    { name: "Google", value: data.google.spend },
  ];

  const hasData = data.total.spend > 0;
  const metaPercent = hasData
    ? Math.round((data.meta.spend / data.total.spend) * 100)
    : 0;
  const googlePercent = hasData ? 100 - metaPercent : 0;

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border-light px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">Auglýsingar</h3>
      </div>

      <div className="px-6 pt-5 pb-6">
        {/* Hero: total spend */}
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">
            {formatKr(data.total.spend)}
          </p>
          <p className="mt-1 text-xs text-text-dim">Heildar eyðsla</p>
        </div>

        {hasData ? (
          <>
            {/* Donut chart */}
            <div className="relative mx-auto mt-5 h-[130px] w-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    <Cell fill={COLORS.meta} />
                    <Cell fill={COLORS.google} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Platform breakdown - two mini cards */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <PlatformCard
                color={COLORS.meta}
                name="Meta"
                spend={data.meta.spend}
                percent={metaPercent}
              />
              <PlatformCard
                color={COLORS.google}
                name="Google"
                spend={data.google.spend}
                percent={googlePercent}
              />
            </div>
          </>
        ) : (
          <p className="mt-6 text-center text-xs text-text-dim">
            Engin auglýsingagögn
          </p>
        )}
      </div>
    </div>
  );
}
