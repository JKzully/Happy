import { NextResponse } from "next/server";
import {
  getShopifyToken,
  clearTokenCache,
  tokenStatus,
} from "@/lib/shopify/token";

export async function GET() {
  const status = tokenStatus();
  return NextResponse.json({
    hasToken: status.valid,
    expiresAt: status.expiresAt
      ? new Date(status.expiresAt).toISOString()
      : null,
    storeUrl: process.env.SHOPIFY_STORE_URL ?? "not set",
    clientIdSet: !!process.env.SHOPIFY_CLIENT_ID,
  });
}

export async function POST() {
  try {
    clearTokenCache();
    await getShopifyToken();
    const status = tokenStatus();
    return NextResponse.json({
      ok: true,
      expiresAt: status.expiresAt
        ? new Date(status.expiresAt).toISOString()
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
