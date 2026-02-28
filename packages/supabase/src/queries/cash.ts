import type { TypedSupabaseClient } from '../client.js';
import { createBrowserClient } from '../client.js';
import type { TablesInsert } from '../database.types.js';

export async function getCashSummary(client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: [], error: null };
  return sb.from('v_cash_summary').select('*');
}

export interface GetCashFlowsOptions {
  limit?: number;
  offset?: number;
  flowType?: string;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getCashFlows(opts?: GetCashFlowsOptions, client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: [], error: null };

  let query = sb.from('cash_flows').select(`
    *,
    assets ( ticker, name )
  `).order('flow_date', { ascending: false });

  if (opts?.flowType) query = query.eq('flow_type', opts.flowType);
  if (opts?.currency) query = query.eq('currency', opts.currency);
  if (opts?.dateFrom) query = query.gte('flow_date', opts.dateFrom);
  if (opts?.dateTo) query = query.lte('flow_date', opts.dateTo);
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  return query;
}

export async function insertCashFlow(flow: TablesInsert<'cash_flows'>, client?: TypedSupabaseClient | null) {
  const sb = client ?? createBrowserClient();
  if (!sb) return { data: null, error: new Error('Supabase not configured') };
  return sb.from('cash_flows').insert(flow).select().single();
}
