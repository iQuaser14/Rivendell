import type { TypedSupabaseClient } from '../client.js';
import { createBrowserClient } from '../client.js';

export async function getLatestSnapshot(client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: null, error: null };
  return sb.from('portfolio_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();
}

export interface SnapshotRangeOptions {
  from?: string;
  to?: string;
  limit?: number;
}

export async function getPortfolioSnapshots(range?: SnapshotRangeOptions, client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: [], error: null };

  let query = sb.from('portfolio_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: true });

  if (range?.from) query = query.gte('snapshot_date', range.from);
  if (range?.to) query = query.lte('snapshot_date', range.to);
  if (range?.limit) query = query.limit(range.limit);

  return query;
}
