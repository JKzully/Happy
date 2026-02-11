"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatKr } from "@/lib/format";

interface AdSpendBreakdown {
  meta: { spend: number; revenue: number; roas: number };
  google: { spend: number; revenue: number; roas: number };
  total: { spend: number; roas: number };
}

const COLORS = {
  meta: "#3B82F6",
  google: "#F59E0B",
};

function PlatformRow({
  color,
  name,
  spend,
  roas,
}: {
  color: string;
  name: string;
  spend: number;
  roas: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm font-medium text-foreground">{name}</span>
      <span className="ml-auto text-sm tabular-nums text-text-secondary">
        {formatKr(spend)}
      </span>
      <span className="w-12 text-right text-xs font-semibold tabular-nums text-text-dim">
        {roas}x
      </span>
    </div>
  );
}

export function AdDonutCard({ data }: { data: AdSpendBreakdown }) {
  const chartData = [
    { name: "Meta", value: data.meta.spend },
    { name: "Google", value: data.google.spend },
  ];

  const hasData = data.total.spend > 0;

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="border-b border-border-light px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">Auglýsingar</h3>
      </div>

      <div className="flex flex-col items-center px-6 pt-5 pb-6">
        {/* Hero: total spend */}
        <p className="text-3xl font-bold text-foreground">
          {formatKr(data.total.spend)}
        </p>
        <p className="mt-1 text-sm text-text-dim">Heildar auglýsingakostnaður</p>

        {/* ROAS pill */}
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1">
          <span className="text-xs font-semibold text-primary">
            ROAS {data.total.roas}x
          </span>
        </div>

        {/* Donut */}
        {hasData && (
          <div className="relative mt-5 h-[120px] w-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={56}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill={COLORS.meta} />
                  <Cell fill={COLORS.google} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Platform breakdown */}
        <div className="mt-5 w-full space-y-3">
          <PlatformRow
            color={COLORS.meta}
            name="Meta"
            spend={data.meta.spend}
            roas={data.meta.roas}
          />
          <PlatformRow
            color={COLORS.google}
            name="Google"
            spend={data.google.spend}
            roas={data.google.roas}
          />
        </div>
      </div>
    </div>
  );
}
