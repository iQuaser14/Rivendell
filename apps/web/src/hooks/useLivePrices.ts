'use client';

import { useQuery } from '@tanstack/react-query';
import { isAnyMarketOpen } from '@rivendell/core';
import type { QuotesResponse, YahooQuote } from '@/app/api/quotes/route';

export type LivePriceMap = Record<string, YahooQuote>;

async function fetchQuotes(tickers: string[]): Promise<LivePriceMap> {
  if (tickers.length === 0) return {};

  const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(tickers.join(','))}`);
  if (!res.ok) return {};

  const data: QuotesResponse = await res.json();
  const map: LivePriceMap = {};
  for (const q of data.quotes) {
    map[q.symbol] = q;
  }
  return map;
}

interface UseLivePricesOptions {
  /** Ticker symbols to fetch (e.g. ["AAPL", "SHEL.L"]) */
  tickers: string[];
  /** Exchange codes for market hours detection */
  exchanges: string[];
  /** Whether polling is enabled (default: true) */
  enabled?: boolean;
}

/**
 * React Query hook that polls Yahoo Finance every 30s during market hours.
 * Stops polling when markets are closed or tab is hidden.
 */
export function useLivePrices({ tickers, exchanges, enabled = true }: UseLivePricesOptions) {
  const marketsOpen = isAnyMarketOpen(exchanges);

  const query = useQuery({
    queryKey: ['live-prices', tickers.sort().join(',')],
    queryFn: () => fetchQuotes(tickers),
    enabled: enabled && tickers.length > 0,
    refetchInterval: marketsOpen ? 30_000 : false,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  });

  return {
    prices: query.data ?? ({} as LivePriceMap),
    isLoading: query.isLoading,
    isError: query.isError,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
    marketsOpen,
    refetch: query.refetch,
  };
}
