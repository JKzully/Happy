import type { Period } from "@/components/ui/period-tabs";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday-based start of week (Icelandic convention) */
function getMonday(d: Date): Date {
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? 6 : day - 1; // offset to Monday
  const mon = new Date(d);
  mon.setDate(mon.getDate() - diff);
  return mon;
}

export function getDateRange(period: Period): DateRange {
  const today = new Date();
  const todayStr = fmt(today);

  switch (period) {
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = fmt(yesterday);
      return { from: yesterdayStr, to: yesterdayStr };
    }

    case "compare": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: fmt(yesterday), to: fmt(yesterday) };
    }

    case "week": {
      const monday = getMonday(today);
      return { from: fmt(monday), to: todayStr };
    }

    case "month": {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: fmt(first), to: todayStr };
    }

    case "30d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from: fmt(from), to: todayStr };
    }
  }
}

/** Same period shifted back one year (for YoY comparison) */
export function getLastYearRange(range: DateRange): DateRange {
  const from = new Date(range.from);
  const to = new Date(range.to);
  from.setFullYear(from.getFullYear() - 1);
  to.setFullYear(to.getFullYear() - 1);
  return { from: fmt(from), to: fmt(to) };
}

/** Trailing 30 days ending today (for trend calculation) */
export function getTrailing30d(): DateRange {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 29);
  return { from: fmt(from), to: fmt(today) };
}

/** Number of days in a range (inclusive) */
export function rangeDays(range: DateRange): number {
  const from = new Date(range.from);
  const to = new Date(range.to);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
}
