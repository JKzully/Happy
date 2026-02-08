import Image from "next/image";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatKr } from "@/lib/format";

export function AdSpendSection({
  meta,
  google,
  total,
}: {
  meta: { spend: number; revenue: number; roas: number };
  google: { spend: number; revenue: number; roas: number };
  total: { spend: number; roas: number };
}) {
  const metaPct = (meta.spend / total.spend) * 100;
  const googlePct = (google.spend / total.spend) * 100;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-foreground">
          Auglýsingar í dag
        </h3>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-3">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="20"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#60A5FA"
                strokeWidth="20"
                strokeDasharray={`${metaPct * 3.14} ${314}`}
                strokeDashoffset="0"
                transform="rotate(-90 60 60)"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#FBBF24"
                strokeWidth="20"
                strokeDasharray={`${googlePct * 3.14} ${314}`}
                strokeDashoffset={`${-metaPct * 3.14}`}
                transform="rotate(-90 60 60)"
              />
              <text
                x="60"
                y="54"
                textAnchor="middle"
                className="text-[10px] font-semibold uppercase tracking-wider"
                fill="#71717A"
              >
                ROAS
              </text>
              <text
                x="60"
                y="74"
                textAnchor="middle"
                className="text-xl font-bold"
                fill="#FAFAFA"
              >
                {total.roas}x
              </text>
            </svg>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Image src="/logos/meta.png" alt="Meta" width={16} height={16} className="h-4 w-4 object-contain" />
                <span className="text-text-dim">Meta</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Image src="/logos/google.svg" alt="Google" width={16} height={16} className="h-4 w-4 object-contain" />
                <span className="text-text-dim">Google</span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="rounded-lg bg-info-light p-3 ring-1 ring-[rgba(96,165,250,0.12)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Image src="/logos/meta.png" alt="Meta" width={14} height={14} className="h-3.5 w-3.5 object-contain" />
                  <span className="text-xs font-medium text-info">Meta</span>
                </div>
                <span className="text-xs font-semibold text-info">
                  ROAS {meta.roas}x
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-foreground">
                {formatKr(meta.spend)}
              </p>
              <p className="text-xs text-text-dim">
                Tekjur: {formatKr(meta.revenue)}
              </p>
            </div>
            <div className="rounded-lg bg-warning-light p-3 ring-1 ring-[rgba(251,191,36,0.12)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Image src="/logos/google.svg" alt="Google" width={14} height={14} className="h-3.5 w-3.5 object-contain" />
                  <span className="text-xs font-medium text-warning">Google</span>
                </div>
                <span className="text-xs font-semibold text-warning">
                  ROAS {google.roas}x
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-foreground">
                {formatKr(google.spend)}
              </p>
              <p className="text-xs text-text-dim">
                Tekjur: {formatKr(google.revenue)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
