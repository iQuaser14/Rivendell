import { createServerClient as createSB } from '@rivendell/supabase';

export function getServerClient() {
  return createSB();
}
