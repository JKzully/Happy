import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { shopifyFetchAll } from "@/lib/shopify/client";

interface ShopifyLineItem {
  title: string;
  quantity: number;
  price: string;
}

interface ShopifyOrder {
  id: number;
  created_at: string;
  line_items: ShopifyLineItem[];
}

/**
 * Create a Supabase client with service_role key (bypasses RLS).
 */
function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Map Shopify product title → DB product category.
 * Shopify uses parent names like "Hydration Xpress", "Creatine Xpress", etc.
 * Merch items (Happy Peysa, Buxur, Brúsi, etc.) are ignored.
 */
const SHOPIFY_CATEGORY_MAP: Record<string, string> = {
  "hydration xpress": "hydration",
  "creatine xpress": "creatine",
  "energy xpress": "energy",
  "hydration kids": "kids",
};

function matchProductCategory(
  shopifyTitle: string,
): string | null {
  const normalized = shopifyTitle.toLowerCase().trim();
  for (const [key, category] of Object.entries(SHOPIFY_CATEGORY_MAP)) {
    if (normalized.includes(key)) return category;
  }
  return null;
}

async function syncOrders(targetDate?: string) {
  const sb = supabaseAdmin();

  // Determine sync date (default: yesterday)
  const date =
    targetDate ??
    new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  // 1. Get Shopify store_id from DB
  const { data: storeRow, error: storeErr } = await sb
    .from("stores")
    .select("id")
    .eq("name", "Shopify Direct")
    .single();

  if (storeErr || !storeRow) {
    throw new Error(
      `Shopify store not found in DB. Run migration 00006. ${storeErr?.message ?? ""}`,
    );
  }

  const storeId = storeRow.id;

  // 2. Get all products from DB, pick one representative per category
  const { data: products } = await sb
    .from("products")
    .select("id, name, category");
  if (!products || products.length === 0) {
    throw new Error("No products in DB");
  }

  // Build category → first product ID lookup
  const categoryProduct: Record<string, string> = {};
  for (const p of products) {
    if (!categoryProduct[p.category]) {
      categoryProduct[p.category] = p.id;
    }
  }

  // 3. Fetch Shopify orders for the target date
  const orders = await shopifyFetchAll<ShopifyOrder>(
    "orders.json",
    "orders",
    {
      status: "any",
      created_at_min: `${date}T00:00:00Z`,
      created_at_max: `${date}T23:59:59Z`,
    },
  );

  // 4. Aggregate: category → total quantity for the day
  const productQty = new Map<string, number>();
  const unmatchedProducts = new Set<string>();

  for (const order of orders) {
    for (const item of order.line_items) {
      const category = matchProductCategory(item.title);
      if (!category) {
        unmatchedProducts.add(item.title);
        continue;
      }
      const productId = categoryProduct[category];
      if (!productId) {
        unmatchedProducts.add(item.title);
        continue;
      }
      productQty.set(productId, (productQty.get(productId) ?? 0) + item.quantity);
    }
  }

  // 5. Upsert into daily_sales
  const rows = Array.from(productQty.entries()).map(
    ([product_id, quantity]) => ({
      date,
      store_id: storeId,
      product_id,
      quantity,
    }),
  );

  let synced = 0;

  if (rows.length > 0) {
    const { error: upsertErr, count } = await sb
      .from("daily_sales")
      .upsert(rows, { onConflict: "date,store_id,product_id", count: "exact" });

    if (upsertErr) {
      throw new Error(`Upsert failed: ${upsertErr.message}`);
    }
    synced = count ?? rows.length;
  }

  return {
    synced,
    date,
    ordersProcessed: orders.length,
    unmatchedProducts: Array.from(unmatchedProducts),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetDate = (body as { date?: string }).date;
    const result = await syncOrders(targetDate);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET works as cron target (Vercel cron calls GET)
export async function GET() {
  try {
    const result = await syncOrders();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
