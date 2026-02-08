import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { AlertTriangle } from "lucide-react";

const typeStyles = {
  danger: "bg-danger-light text-danger ring-1 ring-[rgba(251,113,133,0.15)]",
  warning: "bg-warning-light text-warning ring-1 ring-[rgba(251,191,36,0.15)]",
  info: "bg-info-light text-info ring-1 ring-[rgba(96,165,250,0.15)]",
  success: "bg-primary-light text-primary ring-1 ring-primary-border/30",
};

export function AlertsCard({
  alerts,
}: {
  alerts: { type: keyof typeof typeStyles; message: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">Tilkynningar</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-4">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-medium",
              typeStyles[alert.type]
            )}
          >
            {alert.message}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
