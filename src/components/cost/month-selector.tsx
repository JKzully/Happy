"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";

const MONTHS_IS = [
  "Janúar", "Febrúar", "Mars", "Apríl", "Maí", "Júní",
  "Júlí", "Ágúst", "September", "Október", "Nóvember", "Desember",
];

export function MonthSelector({
  month,
  onChange,
  isLocked,
}: {
  month: string; // "YYYY-MM"
  onChange: (month: string) => void;
  isLocked: boolean;
}) {
  const [y, m] = month.split("-").map(Number);
  const label = `${MONTHS_IS[m - 1]} ${y}`;

  const go = (delta: number) => {
    const d = new Date(y, m - 1 + delta, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    onChange(newMonth);
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon-xs" onClick={() => go(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[160px] text-center text-sm font-semibold text-foreground">
        {label}
      </span>
      <Button variant="ghost" size="icon-xs" onClick={() => go(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      {isLocked && (
        <Badge variant="warning">
          <Lock className="h-3 w-3" />
          Staðfest
        </Badge>
      )}
    </div>
  );
}
