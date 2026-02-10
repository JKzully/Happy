import { getShopifyToken } from "./token";

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL!;
const API_VERSION = "2024-01";

function baseUrl(): string {
  return `https://${SHOPIFY_STORE_URL}/admin/api/${API_VERSION}`;
}

export interface ShopifyPaginatedResult<T> {
  data: T[];
  hasNextPage: boolean;
}

/**
 * Fetch a single page from the Shopify Admin REST API.
 */
export async function shopifyFetch<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<{ data: T; headers: Headers }> {
  const token = await getShopifyToken();
  const url = new URL(`${baseUrl()}/${endpoint}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify API ${endpoint} failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as T;
  return { data, headers: res.headers };
}

/**
 * Parse the Link header for cursor-based pagination.
 * Returns the page_info value for the "next" page, or null.
 */
function parseNextPageInfo(headers: Headers): string | null {
  const link = headers.get("link");
  if (!link) return null;

  const parts = link.split(",");
  for (const part of parts) {
    if (part.includes('rel="next"')) {
      const match = part.match(/page_info=([^>&]+)/);
      return match?.[1] ?? null;
    }
  }
  return null;
}

/**
 * Fetch all pages of a Shopify collection endpoint.
 * `dataKey` is the JSON key containing the array (e.g. "orders").
 */
export async function shopifyFetchAll<T>(
  endpoint: string,
  dataKey: string,
  params?: Record<string, string>,
  limit = 250,
): Promise<T[]> {
  const allItems: T[] = [];
  let pageParams: Record<string, string> = {
    ...params,
    limit: String(limit),
  };

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, headers } = await shopifyFetch<Record<string, T[]>>(
      endpoint,
      pageParams,
    );

    const items = data[dataKey] ?? [];
    allItems.push(...items);

    const nextPageInfo = parseNextPageInfo(headers);
    if (!nextPageInfo || items.length < limit) break;

    // For subsequent pages, only send page_info and limit (Shopify requirement)
    pageParams = { limit: String(limit), page_info: nextPageInfo };
  }

  return allItems;
}
