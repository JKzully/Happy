const REPEAT_API_KEY = process.env.REPEAT_API_KEY!;
const BASE_URL = "https://repeat.is/api/v1";

export interface RepeatProduct {
  uuid: string;
  title: string;
}

export interface RepeatCustomer {
  uuid: string;
  name: string;
  email: string;
}

export interface RepeatSubscription {
  uuid: string;
  product: RepeatProduct;
  customer: RepeatCustomer;
  active: boolean;
  created: string;
  updated: string;
  cancelled_at: string | null;
  price: number;
  quantity: number;
  currency: string;
  interval: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  next_page_number: number | null;
  previous: string | null;
  previous_page_number: number | null;
  total_pages: number;
  results: T[];
}

/**
 * Fetch a single page from the Repeat.is API.
 */
async function repeatFetch<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    headers: { "X-API-Key": REPEAT_API_KEY },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Repeat API ${endpoint} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Fetch all pages of a paginated Repeat.is endpoint.
 */
export async function repeatFetchAll<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await repeatFetch<PaginatedResponse<T>>(endpoint, {
      ...params,
      page: String(page),
    });

    allItems.push(...res.results);

    if (!res.next) break;
    page++;
  }

  return allItems;
}

/**
 * Fetch all subscriptions (both active and inactive).
 */
export async function fetchAllSubscriptions(): Promise<RepeatSubscription[]> {
  const [active, inactive] = await Promise.all([
    repeatFetchAll<RepeatSubscription>("subscriptions/", { active: "true" }),
    repeatFetchAll<RepeatSubscription>("subscriptions/", { active: "false" }),
  ]);
  return [...active, ...inactive];
}
