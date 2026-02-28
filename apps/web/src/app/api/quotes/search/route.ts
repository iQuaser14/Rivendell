import { NextRequest, NextResponse } from 'next/server';

/**
 * Yahoo Finance ticker search proxy.
 * GET /api/quotes/search?q=shell
 *
 * Returns matching tickers with metadata for type-ahead in the trade form.
 */

export interface SearchResult {
  symbol: string;
  shortName: string;
  exchange: string;
  quoteType: string; // "EQUITY", "ETF", "OPTION", etc.
  currency: string;
  sector?: string;
  industry?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  error?: string;
}

const YAHOO_SEARCH = 'https://query2.finance.yahoo.com/v1/finance/search';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.length < 1) {
    return NextResponse.json({ results: [], error: 'Missing q parameter' }, { status: 400 });
  }

  try {
    const url = `${YAHOO_SEARCH}?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0&listsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      return NextResponse.json(
        { results: [], error: `Yahoo returned ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const quotes = data?.quotes ?? [];

    const results: SearchResult[] = quotes
      .filter((q: Record<string, unknown>) => {
        const type = (q.quoteType as string) ?? '';
        return ['EQUITY', 'ETF', 'MUTUALFUND', 'INDEX'].includes(type);
      })
      .map((q: Record<string, unknown>) => ({
        symbol: q.symbol ?? '',
        shortName: q.shortname ?? q.longname ?? '',
        exchange: q.exchange ?? '',
        quoteType: q.quoteType ?? '',
        currency: (q as Record<string, unknown>).currency ?? '',
        sector: (q as Record<string, unknown>).sector as string | undefined,
        industry: (q as Record<string, unknown>).industry as string | undefined,
      }));

    return NextResponse.json({ results } satisfies SearchResponse);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      { results: [], error: message } satisfies SearchResponse,
      { status: 500 },
    );
  }
}
