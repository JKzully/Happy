const GOOGLE_ADS_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID!;
const GOOGLE_ADS_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET!;
const GOOGLE_ADS_REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN!;

interface TokenData {
  access_token: string;
  expires_at: number; // epoch ms
}

let cached: TokenData | null = null;

export async function getGoogleAdsToken(): Promise<string> {
  if (cached && Date.now() < cached.expires_at - 60_000) {
    return cached.access_token;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: GOOGLE_ADS_CLIENT_ID,
      client_secret: GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: GOOGLE_ADS_REFRESH_TOKEN,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google OAuth2 token refresh failed (${res.status}): ${text}`);
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
