import type { TypedSupabaseClient } from '../client.js';
import { createBrowserClient } from '../client.js';

export async function getPortfolioCurrent(client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: [], error: null };
  return sb.from('v_portfolio_current').select('*').order('total_cost_eur', { ascending: false, nullsFirst: false });
}

export async function getPositionByAsset(assetId: string, client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: null, error: null };
  return sb.from('positions').select('*').eq('asset_id', assetId).single();
}
