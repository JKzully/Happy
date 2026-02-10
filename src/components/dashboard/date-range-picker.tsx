"use client";

import { useState } from "react";
import { format, subDays, subMonths, startOfMonth, startOfYear } from "date-fns";
import { is } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DateRange } from "@/lib/date-ranges";

const quickSelects = [
  { label: "Síðasti mánuður", getRange: () => ({ from: subMonths(new Date(), 1), to: subDays(new Date(), 1) }) },
  { label: "Síðustu 3 mánuðir", getRange: () => ({ from: subMonths(new Date(), 3), to: subDays(new Date(), 1) }) },
  { label: "Allt árið", getRange: () => ({ from: startOfYear(new Date()), to: subDays(new Date(), 1) }) },
  { label: "Þessi mánuður", getRange: () => ({ from: startOfMonth(new Date()), to: subDays(new Date(), 1) }) },
] as const;

function fmt(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function formatDisplay(d: Date): string {
  return format(d, "d. MMM yyyy", { locale: is });
}

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const fromDate = new Date(value.from + "T00:00:00");
  const toDate = new Date(value.to + "T00:00:00");

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Quick select buttons */}
      <div className="flex gap-2">
        {quickSelects.map((qs) => (
          <Button
            key={qs.label}
            variant="outline"
            size="sm"
            onClick={() => {
              const r = qs.getRange();
              onChange({ from: fmt(r.from), to: fmt(r.to) });
            }}
          >
            {qs.label}
          </Button>
        ))}
      </div>

      <div className="h-6 w-px bg-border" />

      {/* From date picker */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-text-dim">Frá</span>
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 font-normal">
              <CalendarIcon className="h-3.5 w-3.5" />
              {formatDisplay(fromDate)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={(date) => {
                if (date) {
                  onChange({ from: fmt(date), to: value.to });
                  setFromOpen(false);
                }
              }}
              defaultMonth={fromDate}
              disabled={{ after: toDate }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* To date picker */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-text-dim">Til</span>
        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 font-normal">
              <CalendarIcon className="h-3.5 w-3.5" />
              {formatDisplay(toDate)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={(date) => {
                if (date) {
                  onChange({ from: value.from, to: fmt(date) });
                  setToOpen(false);
                }
              }}
              defaultMonth={toDate}
              disabled={{ before: fromDate, after: new Date() }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
