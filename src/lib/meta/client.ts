const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!;
const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID!;

/**
 * Fetch total daily spend from the Meta Marketing API for a given date.
 * Returns spend in currency units (e.g. USD) or 0 if no data.
 */
export async function fetchMetaDailySpend(date: string): Promise<number> {
  const url = new URL(
    `https://graph.facebook.com/v21.0/act_${META_AD_ACCOUNT_ID}/insights`,
  );
  url.searchParams.set("fields", "spend");
  url.searchParams.set(
    "time_range",
    JSON.stringify({ since: date, until: date }),
  );
  url.searchParams.set("level", "account");
  url.searchParams.set("access_token", META_ACCESS_TOKEN);

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta Insights API error (${res.status}): ${text}`);
  }

  const json = await res.json();
  const spend: string | undefined = json.data?.[0]?.spend;
  return spend ? parseFloat(spend) : 0;
}
