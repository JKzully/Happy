import { NextRequest, NextResponse } from "next/server";
import { shopifyFetchAll } from "@/lib/shopify/client";

interface ShopifyLineItem {
  title: string;
  quantity: number;
  price: string;
}

interface ShopifyOrder {
  id: number;
  created_at: string;
  total_price: string;
  currency: string;
  line_items: ShopifyLineItem[];
  customer?: { first_name: string; last_name: string } | null;
}

interface DaySummary {
  date: string;
  orders: number;
  revenue: number;
}

interface ProductSummary {
  title: string;
  quantity: number;
  revenue: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing ?from= and ?to= query params (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  try {
    const orders = await shopifyFetchAll<ShopifyOrder>(
      "orders.json",
      "orders",
      {
        status: "any",
        created_at_min: `${from}T00:00:00Z`,
        created_at_max: `${to}T23:59:59Z`,
      },
    );

    // Daily summary
    const dailyMap = new Map<string, DaySummary>();
    // Product summary
    const productMap = new Map<string, ProductSummary>();

    let totalRevenue = 0;

    for (const order of orders) {
      const date = order.created_at.slice(0, 10); // YYYY-MM-DD
      const orderTotal = parseFloat(order.total_price);
      totalRevenue += orderTotal;

      // Daily
      const day = dailyMap.get(date) ?? { date, orders: 0, revenue: 0 };
      day.orders += 1;
      day.revenue += orderTotal;
      dailyMap.set(date, day);

      // Products
      for (const item of order.line_items) {
        const p = productMap.get(item.title) ?? {
          title: item.title,
          quantity: 0,
          revenue: 0,
        };
        p.quantity += item.quantity;
        p.revenue += item.quantity * parseFloat(item.price);
        productMap.set(item.title, p);
      }
    }

    const dailySales = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const topProducts = Array.from(productMap.values()).sort(
      (a, b) => b.revenue - a.revenue,
    );

    return NextResponse.json({
      totalOrders: orders.length,
      totalRevenue,
      period: { from, to },
      dailySales,
      topProducts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
