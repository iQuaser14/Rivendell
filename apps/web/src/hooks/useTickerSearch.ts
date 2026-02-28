'use client';

import { useQuery } from '@tanstack/react-query';
import type { SearchResponse, SearchResult } from '@/app/api/quotes/search/route';

async function searchTickers(query: string): Promise<SearchResult[]> {
  if (query.length < 1) return [];

  const res = await fetch(`/api/quotes/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];

  const data: SearchResponse = await res.json();
  return data.results;
}

/**
 * React Query hook for ticker type-ahead search.
 * Debounced via staleTime + enabled guard.
 */
export function useTickerSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['ticker-search', trimmed],
    queryFn: () => searchTickers(trimmed),
    enabled: trimmed.length >= 1,
    staleTime: 60_000, // Cache results for 1 minute
  });
}
