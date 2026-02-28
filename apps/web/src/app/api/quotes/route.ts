import { NextRequest, NextResponse } from 'next/server';

/**
 * Yahoo Finance quote proxy.
 * GET /api/quotes?symbols=AAPL,MSFT,SHEL.L
 *
 * Returns normalized price data for the requested tickers.
 * Proxied server-side to avoid CORS issues.
 */

export interface YahooQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  currency: string;
  exchange: string;
  marketState: string; // "REGULAR", "PRE", "POST", "CLOSED"
}

export interface QuotesResponse {
  quotes: YahooQuote[];
  error?: string;
}

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v7/finance/quote';

export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get('symbols');
  if (!symbols) {
    return NextResponse.json({ quotes: [], error: 'Missing symbols parameter' }, { status: 400 });
  }

  try {
    const url = `${YAHOO_BASE}?symbols=${encodeURIComponent(symbols)}&fields=symbol,shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,currency,exchange,marketState`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 15 }, // Cache for 15 seconds
    });

    if (!res.ok) {
      return NextResponse.json(
        { quotes: [], error: `Yahoo Finance returned ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const result = data?.quoteResponse?.result ?? [];

    const quotes: YahooQuote[] = result.map((q: Record<string, unknown>) => ({
      symbol: q.symbol ?? '',
      shortName: q.shortName ?? q.longName ?? '',
      regularMarketPrice: q.regularMarketPrice ?? 0,
      regularMarketChange: q.regularMarketChange ?? 0,
      regularMarketChangePercent: q.regularMarketChangePercent ?? 0,
      regularMarketPreviousClose: q.regularMarketPreviousClose ?? 0,
      currency: q.currency ?? '',
      exchange: q.exchange ?? '',
      marketState: q.marketState ?? 'CLOSED',
    }));

    return NextResponse.json({ quotes } satisfies QuotesResponse);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      { quotes: [], error: message } satisfies QuotesResponse,
      { status: 500 },
    );
  }
}
