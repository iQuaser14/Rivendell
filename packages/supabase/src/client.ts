import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types.js';

export type TypedSupabaseClient = SupabaseClient<Database>;

function getEnvVars() {
  const url = typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : undefined;
  const key = typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : undefined;
  return { url, key };
}

let browserClient: TypedSupabaseClient | null = null;

export function createBrowserClient(): TypedSupabaseClient | null {
  const { url, key } = getEnvVars();
  if (!url || !key) return null;
  if (browserClient) return browserClient;
  browserClient = createClient<Database>(url, key);
  return browserClient;
}

export function createServerClient(): TypedSupabaseClient | null {
  const { url, key } = getEnvVars();
  if (!url || !key) return null;
  // In Phase 2, identical to browser client. Will diverge with auth (cookies).
  return createClient<Database>(url, key);
}
