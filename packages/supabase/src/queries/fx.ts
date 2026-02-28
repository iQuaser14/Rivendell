import type { TypedSupabaseClient } from '../client.js';
import { createBrowserClient } from '../client.js';

export async function getLatestFxRates(client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: [], error: null };

  // Get the most recent rate for each quote currency
  return sb.from('fx_rates')
    .select('*')
    .order('date', { ascending: false })
    .limit(20);
}
