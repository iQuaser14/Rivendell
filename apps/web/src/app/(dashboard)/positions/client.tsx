'use client';

import { useState } from 'react';
import { useLivePrices } from '@/hooks/useLivePrices';
import { extractExchanges } from '@rivendell/core';
import { PositionsSummary } from '@/components/dashboard/positions-summary';
import { PositionsTable } from '@/components/tables/positions-table';
import { MarketStatus } from '@/components/dashboard/market-status';
import { TradeForm } from '@/components/forms/trade-form';
import { createTrade } from '../trades/actions';
import type { Views } from '@rivendell/supabase';

interface PositionsClientProps {
  positions: Views<'v_portfolio_current'>[];
}

export function PositionsClient({ positions }: PositionsClientProps) {
  const [sellPrefill, setSellPrefill] = useState<{
    ticker: string;
    assetId: string;
    side: string;
    quantity: number;
    price: number;
    currency: string;
  } | null>(null);

  const tickers = positions.map((p) => p.ticker).filter(Boolean);
  const exchanges = extractExchanges(
    positions.map((p) => ({ exchange: (p as any).exchange ?? null })),
  );

  const { prices, lastUpdated } = useLivePrices({
    tickers,
    exchanges,
    enabled: tickers.length > 0,
  });

  // Merge live prices into positions for display
  const enrichedPositions = positions.map((p) => {
    const quote = prices[p.ticker];
    if (!quote) return p;

    return {
      ...p,
      market_price_local: quote.regularMarketPrice,
    };
  });

  const assets = positions.map((p) => ({
    id: p.asset_id,
    ticker: p.ticker,
    currency: p.trading_currency,
  }));

  const handleQuickSell = (pos: Views<'v_portfolio_current'>) => {
    const quote = prices[pos.ticker];
    setSellPrefill({
      ticker: pos.ticker,
      assetId: pos.asset_id,
      side: pos.quantity > 0 ? 'SELL' : 'COVER',
      quantity: Math.abs(pos.quantity),
      price: quote?.regularMarketPrice ?? pos.market_price_local ?? 0,
      currency: pos.trading_currency,
    });
  };

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <MarketStatus exchanges={exchanges} lastUpdated={lastUpdated} />
      </div>
      <div className="space-y-6">
        <PositionsSummary positions={enrichedPositions} />
        <PositionsTable positions={enrichedPositions} onQuickSell={handleQuickSell} />
      </div>

      {sellPrefill && (
        <TradeForm
          assets={assets}
          prefill={sellPrefill}
          onSubmit={createTrade}
          onClose={() => setSellPrefill(null)}
        />
      )}
    </>
  );
}
