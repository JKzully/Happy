import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { AlertCircle } from "lucide-react";
import type { DeadStore } from "@/lib/data/mock-sales";

export function DeadStoresCard({ stores }: { stores: DeadStore[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-danger" />
          <h3 className="text-sm font-semibold text-foreground">
            Verslanir án sölu
          </h3>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          {stores
            .sort((a, b) => b.daysSinceSale - a.daysSinceSale)
            .map((store) => (
              <div
                key={store.storeName}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium ring-1",
                  store.daysSinceSale >= 10
                    ? "bg-danger-light text-danger ring-[rgba(251,113,133,0.15)]"
                    : store.daysSinceSale >= 7
                    ? "bg-warning-light text-warning ring-[rgba(251,191,36,0.15)]"
                    : "bg-surface-elevated text-text-secondary ring-border"
                )}
              >
                {store.storeName}{" "}
                <span className="font-normal opacity-70">({store.daysSinceSale}d)</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
