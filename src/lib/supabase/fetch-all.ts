/** Fetch all rows from a Supabase query, paginating past the 1000-row limit */
export async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null }>,
): Promise<T[]> {
  const PAGE = 1000;
  let all: T[] = [];
  let page = 0;
  while (true) {
    const { data } = await buildQuery(page * PAGE, (page + 1) * PAGE - 1);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    page++;
  }
  return all;
}
