"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatKr } from "@/lib/format";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";

export function ChannelCard({
  name,
  boxes,
  revenue,
  trend,
  avg30dRevenue,
  color,
  logo,
  isExpanded,
  onClick,
  children,
}: {
  name: string;
  boxes: number;
  revenue: number;
  trend: number;
  avg30dRevenue: number;
  color: string;
  logo?: string;
  isExpanded: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  const isPositive = trend >= 0;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onClick}
        className="relative w-full px-5 py-5 text-left transition-colors hover:bg-[rgba(255,255,255,0.02)]"
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
          style={{ backgroundColor: color }}
        />
        <div className="flex items-center justify-between pl-2 mb-3">
          <div className="flex items-center gap-3">
            {logo && (
              <Image
                src={logo}
                alt={name}
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
            )}
            <span className="text-sm font-semibold text-foreground">{name}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-text-dim" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-dim" />
          )}
        </div>
        <div className="grid grid-cols-4 gap-3 pl-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-dim">Kassar</p>
            <p className="text-sm font-bold text-foreground">{boxes}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-dim">Tekjur</p>
            <p className="text-sm font-bold text-foreground">{formatKr(revenue)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-dim">Breyting</p>
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-danger" />
              )}
              <span
                className={cn(
                  "text-sm font-bold",
                  isPositive ? "text-primary" : "text-danger"
                )}
              >
                {isPositive ? "+" : ""}
                {trend}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-dim">30d meðalt.</p>
            <p className="text-sm font-bold text-foreground">{formatKr(avg30dRevenue)}</p>
          </div>
        </div>
      </button>
      {isExpanded && children && (
        <div className="border-t border-border-light">{children}</div>
      )}
    </Card>
  );
}
