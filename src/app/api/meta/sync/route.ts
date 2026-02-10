import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchMetaDailySpend } from "@/lib/meta/client";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function syncMetaSpend(targetDate?: string) {
  const date =
    targetDate ??
    new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  const spend = await fetchMetaDailySpend(date);

  const sb = supabaseAdmin();
  const { error } = await sb
    .from("daily_ad_spend")
    .upsert(
      { date, platform: "meta", amount: spend },
      { onConflict: "date,platform" },
    );

  if (error) {
    throw new Error(`Upsert failed: ${error.message}`);
  }

  return { date, platform: "meta", amount: spend };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetDate = (body as { date?: string }).date;
    const result = await syncMetaSpend(targetDate);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await syncMetaSpend();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
