import type { TypedSupabaseClient } from '../client.js';
import { createBrowserClient } from '../client.js';
import type { TablesInsert } from '../database.types.js';

export async function getAssets(client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: [], error: null };
  return sb.from('assets').select('*').order('ticker');
}

export async function getAssetByTicker(ticker: string, client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: null, error: null };
  return sb.from('assets').select('*').eq('ticker', ticker).single();
}

export async function getAssetByIsin(isin: string, client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: null, error: null };
  return sb.from('assets').select('*').eq('isin', isin).single();
}

export async function upsertAsset(asset: TablesInsert<'assets'>, client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: null, error: new Error('Supabase not configured') };
  return sb.from('assets').upsert(asset, { onConflict: 'ticker,exchange' }).select().single();
}
