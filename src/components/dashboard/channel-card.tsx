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
        className="relative flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-[rgba(255,255,255,0.02)]"
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
          style={{ backgroundColor: color }}
        />
        <div className="flex items-center gap-2.5 pl-2">
          {logo && (
            <Image
              src={logo}
              alt={name}
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
          )}
          <span className="text-sm font-semibold text-foreground">{name}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-foreground">
              {boxes} kassar
            </p>
            <p className="text-xs text-text-dim">{formatKr(revenue)}</p>
          </div>
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-danger" />
            )}
            <span
              className={cn(
                "text-xs font-semibold",
                isPositive ? "text-primary" : "text-danger"
              )}
            >
              {isPositive ? "+" : ""}
              {trend}%
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-text-dim" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-dim" />
          )}
        </div>
      </button>
      {isExpanded && children && (
        <div className="border-t border-border-light">{children}</div>
      )}
    </Card>
  );
}
