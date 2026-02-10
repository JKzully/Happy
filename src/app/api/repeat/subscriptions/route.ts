import { NextResponse } from "next/server";
import {
  fetchAllSubscriptions,
  type RepeatSubscription,
} from "@/lib/repeat/client";

// Shopify average box prices (same as usePeriodSales)
const SHOPIFY_PRICES: Record<string, number> = {
  hydration: 1995,
  creatine: 2890,
  energy: 2890,
  kids: 1690,
};

// 15% subscription discount
const SUB_DISCOUNT = 0.85;

/**
 * Map Repeat product name → DB category for pricing.
 */
function productCategory(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("hydration") && n.includes("kids")) return "kids";
  if (n.includes("hydration")) return "hydration";
  if (n.includes("creatine")) return "creatine";
  if (n.includes("energy")) return "energy";
  if (n.includes("kids") || n.includes("krakka")) return "kids";
  return null;
}

/**
 * Simplify Repeat product title for grouping.
 * "Mixed Berries | 30 stikur í áskrift | Hydration Xpress"
 * → "Hydration Xpress — Mixed Berries"
 */
function simplifyTitle(title: string): string {
  const parts = title.split("|").map((s) => s.trim());
  if (parts.length >= 3) {
    const flavor = parts[0];
    const line = parts[parts.length - 1];
    return `${line} — ${flavor}`;
  }
  return title;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

interface ProductBreakdown {
  productName: string;
  active: number;
  newThisMonth: number;
  cancelledThisMonth: number;
  revenue: number;
}

export async function GET() {
  try {
    const subs = await fetchAllSubscriptions();

    const now = new Date();
    const monthStart = startOfMonth(now);

    // Core counts
    const activeSubs = subs.filter((s) => s.active);
    const newThisMonth = subs.filter(
      (s) => new Date(s.created) >= monthStart,
    );
    const cancelledThisMonth = subs.filter(
      (s) =>
        s.cancelled_at && new Date(s.cancelled_at) >= monthStart && !s.active,
    );

    // Estimate active count at beginning of month for churn rate:
    // activeAtStart = current active + cancelled this month - new this month
    const activeAtStart =
      activeSubs.length + cancelledThisMonth.length - newThisMonth.length;
    const churnRate =
      activeAtStart > 0
        ? (cancelledThisMonth.length / activeAtStart) * 100
        : 0;

    // MRR: each active subscription × box price × discount
    let mrr = 0;
    for (const sub of activeSubs) {
      const cat = productCategory(sub.product.title);
      const price = cat ? (SHOPIFY_PRICES[cat] ?? 1995) : 1995;
      mrr += sub.quantity * price * SUB_DISCOUNT;
    }

    // Per-product breakdown
    const productMap = new Map<string, ProductBreakdown>();

    function getProduct(name: string): ProductBreakdown {
      let p = productMap.get(name);
      if (!p) {
        p = {
          productName: name,
          active: 0,
          newThisMonth: 0,
          cancelledThisMonth: 0,
          revenue: 0,
        };
        productMap.set(name, p);
      }
      return p;
    }

    for (const sub of subs) {
      const name = simplifyTitle(sub.product.title);
      const p = getProduct(name);
      const cat = productCategory(sub.product.title);
      const price = cat ? (SHOPIFY_PRICES[cat] ?? 1995) : 1995;

      if (sub.active) {
        p.active += sub.quantity;
        p.revenue += sub.quantity * price * SUB_DISCOUNT;
      }
      if (new Date(sub.created) >= monthStart) {
        p.newThisMonth += sub.quantity;
      }
      if (
        sub.cancelled_at &&
        new Date(sub.cancelled_at) >= monthStart &&
        !sub.active
      ) {
        p.cancelledThisMonth += sub.quantity;
      }
    }

    const products = Array.from(productMap.values()).sort(
      (a, b) => b.active - a.active,
    );

    // Build historical monthly data from subscriptions' created/cancelled dates
    const monthlyData = buildMonthlyHistory(subs);

    return NextResponse.json({
      kpis: {
        activeSubscribers: activeSubs.length,
        newThisMonth: newThisMonth.length,
        cancelledThisMonth: cancelledThisMonth.length,
        churnRate: Math.round(churnRate * 10) / 10,
        mrr: Math.round(mrr),
      },
      products,
      monthlyData,
      totalSubscriptions: subs.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Build 6-month MRR history from subscription created/cancelled dates.
 */
function buildMonthlyHistory(
  subs: RepeatSubscription[],
): { month: string; active: number; mrr: number; churnRate: number }[] {
  const now = new Date();
  const months: { month: string; start: Date; end: Date }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const label = d.toLocaleDateString("is-IS", {
      month: "short",
      year: "numeric",
    });
    months.push({ month: label, start: d, end });
  }

  return months.map(({ month, end, start }) => {
    // A subscription was active at end of month if:
    // created <= end AND (still active OR cancelled_at > end)
    const activeAtEnd = subs.filter((s) => {
      const created = new Date(s.created);
      if (created > end) return false;
      if (s.active) return true;
      if (s.cancelled_at && new Date(s.cancelled_at) > end) return true;
      return false;
    });

    const cancelledInMonth = subs.filter((s) => {
      if (!s.cancelled_at) return false;
      const cancelled = new Date(s.cancelled_at);
      return cancelled >= start && cancelled <= end;
    });

    const newInMonth = subs.filter((s) => {
      const created = new Date(s.created);
      return created >= start && created <= end;
    });

    const activeAtStart =
      activeAtEnd.length + cancelledInMonth.length - newInMonth.length;

    let mrr = 0;
    for (const sub of activeAtEnd) {
      const cat = productCategory(sub.product.title);
      const price = cat ? (SHOPIFY_PRICES[cat] ?? 1995) : 1995;
      mrr += sub.quantity * price * SUB_DISCOUNT;
    }

    const churnRate =
      activeAtStart > 0
        ? Math.round((cancelledInMonth.length / activeAtStart) * 1000) / 10
        : 0;

    return {
      month,
      active: activeAtEnd.length,
      mrr: Math.round(mrr),
      churnRate,
    };
  });
}
