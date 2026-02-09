import { formatKr } from "@/lib/format";

export function AdSummaryLine({
  roas,
  metaSpend,
  googleSpend,
}: {
  roas: number;
  metaSpend: number;
  googleSpend: number;
}) {
  return (
    <div className="flex items-center justify-center gap-3 text-xs text-text-dim">
      <span className="font-semibold text-text-secondary">ROAS {roas}x</span>
      <span className="text-border">·</span>
      <span>Meta {formatKr(metaSpend)}</span>
      <span className="text-border">·</span>
      <span>Google {formatKr(googleSpend)}</span>
    </div>
  );
}
