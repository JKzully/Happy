import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-surface-elevated" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-surface-elevated" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 animate-pulse rounded-lg bg-surface-elevated" />
          <div className="h-9 w-28 animate-pulse rounded-lg bg-surface-elevated" />
        </div>
      </div>

      {/* Summary bar skeleton */}
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-border bg-surface"
          />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-2xl border border-border bg-surface"
            style={{ animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </div>

      {/* Center spinner overlay */}
      <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-3 shadow-lg pointer-events-auto">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-text-secondary">Hleð síðu...</span>
        </div>
      </div>
    </div>
  );
}
