"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-20">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-light">
            <AlertTriangle className="h-6 w-6 text-danger" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              Villa kom upp
            </h2>
            <p className="text-sm text-text-secondary">
              {error.message || "Óvænt villa kom upp við að hlaða síðu."}
            </p>
            {error.digest && (
              <p className="text-xs text-text-dim font-mono">
                Kóði: {error.digest}
              </p>
            )}
          </div>

          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Reyna aftur
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
