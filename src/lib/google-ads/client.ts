import { getGoogleAdsToken } from "./token";

const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!;
const GOOGLE_ADS_CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID!;

/**
 * Fetch total daily spend from the Google Ads API for a given date.
 * Returns spend in currency units (cost_micros / 1,000,000) or 0 if no data.
 */
export async function fetchGoogleAdsDailySpend(date: string): Promise<number> {
  const token = await getGoogleAdsToken();

  // Customer ID without dashes for the URL
  const customerId = GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");

  const url = `https://googleads.googleapis.com/v23/customers/${customerId}/googleAds:searchStream`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "developer-token": GOOGLE_ADS_DEVELOPER_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `SELECT metrics.cost_micros FROM customer WHERE segments.date = '${date}'`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Ads API error (${res.status}): ${text}`);
  }

  const json = await res.json();

  // searchStream returns an array of result batches
  const costMicros: string | undefined =
    json[0]?.results?.[0]?.metrics?.costMicros;
  return costMicros ? parseInt(costMicros, 10) / 1_000_000 : 0;
}
