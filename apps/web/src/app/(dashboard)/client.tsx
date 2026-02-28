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

  const hasLivePrices = Object.keys(prices).length > 0;

  // Build a working snapshot from positions if no real snapshot exists
  let liveSnapshot = snapshot;

  if (positions.length > 0) {
    // Compute total cost basis from positions as fallback value
    const totalCostBasis = positions.reduce((sum, p) => sum + (p.total_cost_eur ?? 0), 0);
    const totalMarketValue = positions.reduce((sum, p) => sum + (p.market_value_eur ?? 0), 0);
    const hasMarketValues = positions.some((p) => p.market_value_eur != null);

    // Use market value if available, otherwise cost basis
    const baseEquity = hasMarketValues ? totalMarketValue : totalCostBasis;

    if (!snapshot) {
      // Create synthetic snapshot from positions
      liveSnapshot = {
        id: '',
        snapshot_date: new Date().toISOString().slice(0, 10),
        total_equity_eur: baseEquity,
        total_invested_eur: totalCostBasis,
        total_cash_eur: 0,
        cash_breakdown: {},
        daily_pnl_eur: 0,
        daily_return_pct: 0,
        modified_dietz_daily: 0,
        cumulative_twr: 0,
        wtd_return_pct: null,
        mtd_return_pct: null,
        ytd_return_pct: null,
        itd_return_pct: null,
        mwr_ytd: null,
        volatility_30d: null,
        sharpe_ratio_ytd: null,
        sortino_ratio_ytd: null,
        max_drawdown_ytd: null,
        current_drawdown: null,
        benchmark_msci_world_eur: null,
        benchmark_sp500_eur: null,
        excess_return_msci: null,
        excess_return_sp500: null,
        attribution_summary: null,
        allocation_by_class: null,
        allocation_by_sector: null,
        allocation_by_region: null,
        allocation_by_currency: null,
        gross_exposure: null,
        net_exposure: null,
        long_exposure: null,
        short_exposure: null,
      } as any;
    }

    // Overlay live prices if available
    if (hasLivePrices && liveSnapshot) {
      let liveTotalEquity = liveSnapshot.total_cash_eur ?? 0;
      let liveDailyPnl = 0;

      for (const pos of positions) {
        const quote = prices[pos.ticker];
        if (quote && pos.quantity) {
          const fxRate = pos.fx_rate_to_eur ?? pos.avg_fx_rate ?? 1;
          const liveValue = (pos.quantity * quote.regularMarketPrice) / (fxRate || 1);
          liveTotalEquity += liveValue;

          const prevValue = pos.market_value_eur ?? (pos.total_cost_eur ?? 0);
          liveDailyPnl += liveValue - prevValue;
        } else {
          liveTotalEquity += pos.market_value_eur ?? (pos.total_cost_eur ?? 0);
        }
      }

      liveSnapshot = {
        ...liveSnapshot,
        total_equity_eur: liveTotalEquity,
        daily_pnl_eur: (liveSnapshot.daily_pnl_eur ?? 0) + liveDailyPnl,
      };
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <MarketStatus exchanges={exchanges} lastUpdated={lastUpdated} />
      </div>
      <PortfolioHero snapshot={liveSnapshot} positions={positions} />
    </div>
  );
}
