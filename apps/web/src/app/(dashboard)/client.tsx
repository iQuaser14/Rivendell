'use client';

import { useLivePrices } from '@/hooks/useLivePrices';
import { extractExchanges } from '@rivendell/core';
import { PortfolioHero } from '@/components/dashboard/portfolio-hero';
import { MarketStatus } from '@/components/dashboard/market-status';
import type { Tables, Views } from '@rivendell/supabase';

interface DashboardClientProps {
  snapshot: Tables<'portfolio_snapshots'> | null;
  positions: Views<'v_portfolio_current'>[];
}

export function DashboardLiveHeader({ snapshot, positions }: DashboardClientProps) {
  const tickers = positions.map((p) => p.ticker).filter(Boolean);
  const exchanges = extractExchanges(
    positions.map((p) => ({ exchange: (p as any).exchange ?? null })),
  );

  const { prices, lastUpdated, marketsOpen } = useLivePrices({
    tickers,
    exchanges,
    enabled: tickers.length > 0,
  });

  // Compute live portfolio value if we have live prices
  const hasLivePrices = Object.keys(prices).length > 0;

  let liveSnapshot = snapshot;
  if (hasLivePrices && snapshot && positions.length > 0) {
    let liveTotalEquity = snapshot.total_cash_eur ?? 0;
    let liveDailyPnl = 0;

    for (const pos of positions) {
      const quote = prices[pos.ticker];
      if (quote && pos.quantity) {
        // Live market value = quantity * live price / fx_rate
        const fxRate = pos.fx_rate_to_eur ?? 1;
        const liveValue = (pos.quantity * quote.regularMarketPrice) / (fxRate || 1);
        liveTotalEquity += liveValue;

        // Daily P&L from live price change
        const prevValue = pos.market_value_eur ?? 0;
        liveDailyPnl += liveValue - prevValue;
      } else {
        // Use snapshot value
        liveTotalEquity += pos.market_value_eur ?? 0;
      }
    }

    liveSnapshot = {
      ...snapshot,
      total_equity_eur: liveTotalEquity,
      daily_pnl_eur: (snapshot.daily_pnl_eur ?? 0) + liveDailyPnl,
    };
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <MarketStatus exchanges={exchanges} lastUpdated={lastUpdated} />
      </div>
      <PortfolioHero snapshot={liveSnapshot} />
    </div>
  );
}
