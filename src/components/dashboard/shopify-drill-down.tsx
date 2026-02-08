import { formatKr } from "@/lib/format";
import { ShoppingBag, RefreshCw } from "lucide-react";

export function ShopifyDrillDown({
  stakKaup,
  askrift,
}: {
  stakKaup: { boxes: number; revenue: number };
  askrift: { boxes: number; revenue: number };
}) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div className="rounded-xl bg-surface-elevated/60 p-4 ring-1 ring-border">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="h-4 w-4 text-text-dim" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
            Stök kaup
          </span>
        </div>
        <p className="text-lg font-bold text-foreground">
          {stakKaup.boxes} kassar
        </p>
        <p className="text-sm text-text-dim">{formatKr(stakKaup.revenue)}</p>
      </div>
      <div className="rounded-xl bg-surface-elevated/60 p-4 ring-1 ring-border">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="h-4 w-4 text-text-dim" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-dim">
            Áskrift
          </span>
        </div>
        <p className="text-lg font-bold text-foreground">
          {askrift.boxes} kassar
        </p>
        <p className="text-sm text-text-dim">{formatKr(askrift.revenue)}</p>
      </div>
    </div>
  );
}
