const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL!;

interface TokenData {
  access_token: string;
  expires_at: number; // epoch ms
}

let cached: TokenData | null = null;

export async function getShopifyToken(): Promise<string> {
  if (cached && Date.now() < cached.expires_at - 60_000) {
    return cached.access_token;
  }

  const url = `https://${SHOPIFY_STORE_URL}/admin/oauth/access_token`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: SHOPIFY_CLIENT_ID,
      client_secret: SHOPIFY_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify token request failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const expiresIn: number = json.expires_in ?? 3600;

  cached = {
    access_token: json.access_token,
    expires_at: Date.now() + expiresIn * 1000,
  };

  return cached.access_token;
}

export function clearTokenCache(): void {
  cached = null;
}

export function tokenStatus(): { valid: boolean; expiresAt: number | null } {
  if (!cached) return { valid: false, expiresAt: null };
  return {
    valid: Date.now() < cached.expires_at - 60_000,
    expiresAt: cached.expires_at,
  };
}
