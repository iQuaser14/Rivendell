'use client';

import { Card } from '@/components/ui/card';
import { PnlText } from '@/components/ui/pnl-text';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { Tables, Views } from '@rivendell/supabase';

interface PortfolioHeroProps {
  snapshot: Tables<'portfolio_snapshots'> | null;
  positions?: Views<'v_portfolio_current'>[];
}

export function PortfolioHero({ snapshot, positions = [] }: PortfolioHeroProps) {
  if (!snapshot) {
    return (
      <Card className="col-span-full">
        <div className="text-center py-12">
          <p className="text-3xl md:text-4xl font-mono font-bold text-text-primary mb-3">No portfolio data</p>
          <p className="text-base text-muted">Import trades or add positions to get started</p>
        </div>
      </Card>
    );
  }

  const hasPeriodReturns = snapshot.wtd_return_pct != null || snapshot.mtd_return_pct != null;

  const periodReturns = [
    { label: 'WTD', value: snapshot.wtd_return_pct },
    { label: 'MTD', value: snapshot.mtd_return_pct },
    { label: 'YTD', value: snapshot.ytd_return_pct },
    { label: 'ITD', value: snapshot.itd_return_pct },
  ];

  // Position-level stats for when period returns aren't available
  const longCount = positions.filter((p) => p.quantity > 0).length;
  const shortCount = positions.filter((p) => p.quantity < 0).length;
  const totalCost = positions.reduce((s, p) => s + (p.total_cost_eur ?? 0), 0);

  return (
    <Card className="col-span-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm uppercase tracking-wider text-muted mb-1">
            {hasPeriodReturns ? 'Portfolio Value' : 'Cost Basis'}
          </p>
          <p className="text-3xl md:text-4xl lg:text-5xl font-mono font-bold text-text-primary truncate">
            {formatCurrency(snapshot.total_equity_eur)}
          </p>
          {snapshot.daily_pnl_eur ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted">Daily P&L</span>
              <PnlText value={snapshot.daily_pnl_eur} size="lg" />
              <PnlText value={snapshot.daily_return_pct} format="percent" size="md" />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              {positions.length} open positions
            </p>
          )}
        </div>
        {hasPeriodReturns ? (
          <div className="grid grid-cols-4 gap-4 sm:flex sm:gap-8">
            {periodReturns.map(({ label, value }) => (
              <div key={label} className="text-left sm:text-right">
                <p className="text-xs text-muted mb-1">{label}</p>
                <PnlText value={value} format="percent" size="lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 sm:flex sm:gap-8">
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted mb-1">Longs</p>
              <p className="text-xl font-mono font-bold text-positive">{longCount}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted mb-1">Shorts</p>
              <p className="text-xl font-mono font-bold text-negative">{shortCount}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted mb-1">Invested</p>
              <p className="text-xl font-mono font-bold text-text-primary">{formatCurrency(totalCost)}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
