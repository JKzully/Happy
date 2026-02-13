"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { chains } from "@/lib/data/chains";

interface ChannelStatus {
  chainId: string;
  lastDataDate: string | null;
}

// Chains that require manual data entry (exclude auto-synced ones)
const MANUAL_CHAINS = ["kronan", "samkaup", "bonus", "hagkaup"];

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DataStatusBar({
  channels,
}: {
  channels: ChannelStatus[];
}) {
  const yesterday = getYesterday();

  const statuses = MANUAL_CHAINS.map((chainId) => {
    const chain = chains.find((c) => c.id === chainId);
    const channel = channels.find((c) => c.chainId === chainId);
    const hasData = channel?.lastDataDate != null && channel.lastDataDate >= yesterday;
    return { chainId, name: chain?.name ?? chainId, logo: chain?.logo, color: chain?.color ?? "#888", hasData };
  });

  const allGood = statuses.every((s) => s.hasData);
  const missingCount = statuses.filter((s) => !s.hasData).length;

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
      allGood
        ? "border-primary/20 bg-primary/[0.04]"
        : "border-warning/30 bg-warning/[0.04]"
    }`}>
      <span className="text-xs font-medium text-text-dim mr-1">
        {allGood ? "Öll gögn skráð í gær" : `Vantar gögn frá ${missingCount} keðju${missingCount > 1 ? "m" : ""}`}
      </span>

      <div className="flex items-center gap-2">
        {statuses.map((s) => (
          <div
            key={s.chainId}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              s.hasData
                ? "bg-primary/10 text-primary"
                : "bg-warning/10 text-warning"
            }`}
          >
            {s.logo ? (
              <Image src={s.logo} alt={s.name} width={14} height={14} className="h-3.5 w-3.5 rounded object-contain" />
            ) : (
              <div className="h-3.5 w-3.5 rounded text-[8px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: s.color }}>
                {s.name.charAt(0)}
              </div>
            )}
            <span>{s.name}</span>
            {s.hasData ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </div>
        ))}
      </div>

      {!allGood && (
        <Link
          href="/input"
          className="ml-auto text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Skrá gögn &rarr;
        </Link>
      )}
    </div>
  );
}
