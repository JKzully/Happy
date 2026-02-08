import { cn } from "@/lib/cn";
import { Card } from "./card";
import { TrendingUp, TrendingDown } from "lucide-react";

export function StatCard({
  label,
  value,
  trend,
  trendLabel,
  className,
}: {
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  className?: string;
}) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <Card className={cn("p-5", className)}>
      <p className="text-xs font-medium uppercase tracking-wider text-text-dim">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {trend !== undefined && (
        <div className="mt-2.5 flex items-center gap-1.5">
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
          {trendLabel && (
            <span className="text-xs text-text-dim">{trendLabel}</span>
          )}
        </div>
      )}
    </Card>
  );
}
