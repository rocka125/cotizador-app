import type { SupabaseClient } from "@supabase/supabase-js";

// PostgREST (Supabase's REST layer) caps every request at 1000 rows by
// default (db-max-rows), silently — a query with no .range()/.limit() just
// comes back truncated, no error. Tables like price_list_items (~10k+ rows
// per version) blow past that constantly, so anything that needs the FULL
// set must page through it explicitly instead of a single .select().
const PAGE_SIZE = 1000;

// `filterEq` optionally narrows the query (e.g. { version_id: someId }) —
// kept as plain equality filters since that's all the current call sites need.
export async function fetchAllRows<T>(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  filterEq?: Record<string, string>
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  for (;;) {
    let query: any = supabase.from(table).select(columns);
    if (filterEq) {
      for (const [key, value] of Object.entries(filterEq)) query = query.eq(key, value);
    }
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}
