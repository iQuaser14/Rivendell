'use client';

import { createBrowserClient } from '@rivendell/supabase';

export function getBrowserClient() {
  return createBrowserClient();
}
