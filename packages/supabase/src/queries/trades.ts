import type { TypedSupabaseClient } from '../client.js';
import { createBrowserClient } from '../client.js';
import type { TablesInsert } from '../database.types.js';

export interface GetTradesOptions {
  limit?: number;
  offset?: number;
  side?: string;
  assetId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getTrades(opts?: GetTradesOptions, client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: [], error: null };

  let query = sb.from('trades').select(`
    *,
    assets ( ticker, name, asset_class, currency )
  `).order('trade_date', { ascending: false });

  if (opts?.side) query = query.eq('side', opts.side);
  if (opts?.assetId) query = query.eq('asset_id', opts.assetId);
  if (opts?.dateFrom) query = query.gte('trade_date', opts.dateFrom);
  if (opts?.dateTo) query = query.lte('trade_date', opts.dateTo);
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  return query;
}

export async function insertTrade(trade: TablesInsert<'trades'>, client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: null, error: new Error('Supabase not configured') };
  return sb.from('trades').insert(trade).select().single();
}

export async function insertTrades(trades: TablesInsert<'trades'>[], client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: null, error: new Error('Supabase not configured') };
  return sb.from('trades').insert(trades).select();
}
