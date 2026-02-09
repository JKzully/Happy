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

export function AdDonutCard({ data }: { data: AdSpendBreakdown }) {
  const chartData = [
    { name: "Meta", value: data.meta.spend },
    { name: "Google", value: data.google.spend },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="border-b border-border-light px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          Auglýsingar í dag
        </h3>
      </div>

      <div className="flex items-center gap-6 p-5">
        {/* Donut chart */}
        <div className="relative h-[140px] w-[140px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill={COLORS.meta} />
                <Cell fill={COLORS.google} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-dim">
              ROAS
            </span>
            <span className="text-xl font-bold text-foreground">
              {data.total.roas}x
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-4">
          {/* Meta */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.meta }} />
              <span className="text-xs font-semibold text-foreground">Meta</span>
              <span className="ml-auto text-xs font-bold text-foreground">
                {data.meta.roas}x
              </span>
            </div>
            <div className="flex items-center justify-between pl-[18px]">
              <span className="text-[11px] text-text-dim">Eytt</span>
              <span className="text-[11px] font-medium text-text-secondary">
                {formatKr(data.meta.spend)}
              </span>
            </div>
            <div className="flex items-center justify-between pl-[18px]">
              <span className="text-[11px] text-text-dim">Tekjur</span>
              <span className="text-[11px] font-medium text-text-secondary">
                {formatKr(data.meta.revenue)}
              </span>
            </div>
          </div>

          {/* Google */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.google }} />
              <span className="text-xs font-semibold text-foreground">Google</span>
              <span className="ml-auto text-xs font-bold text-foreground">
                {data.google.roas}x
              </span>
            </div>
            <div className="flex items-center justify-between pl-[18px]">
              <span className="text-[11px] text-text-dim">Eytt</span>
              <span className="text-[11px] font-medium text-text-secondary">
                {formatKr(data.google.spend)}
              </span>
            </div>
            <div className="flex items-center justify-between pl-[18px]">
              <span className="text-[11px] text-text-dim">Tekjur</span>
              <span className="text-[11px] font-medium text-text-secondary">
                {formatKr(data.google.revenue)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
