'use client';

import { Card } from '@/components/ui/card';
import { PnlText } from '@/components/ui/pnl-text';
import { formatCurrency } from '@/lib/utils';
import type { Tables } from '@rivendell/supabase';

interface PortfolioHeroProps {
  snapshot: Tables<'portfolio_snapshots'> | null;
}

export function PortfolioHero({ snapshot }: PortfolioHeroProps) {
  if (!snapshot) {
    return (
      <Card className="col-span-full">
        <div className="text-center py-8">
          <p className="text-xl sm:text-3xl font-mono font-bold text-text-primary mb-2">No portfolio data</p>
          <p className="text-xs sm:text-sm text-muted">Import trades or add positions to get started</p>
        </div>
      </Card>
    );
  }

  const periodReturns = [
    { label: 'WTD', value: snapshot.wtd_return_pct },
    { label: 'MTD', value: snapshot.mtd_return_pct },
    { label: 'YTD', value: snapshot.ytd_return_pct },
    { label: 'ITD', value: snapshot.itd_return_pct },
  ];

  return (
    <Card className="col-span-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted mb-1">Portfolio Value</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-text-primary truncate">
            {formatCurrency(snapshot.total_equity_eur)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-xs text-muted">Daily P&L</span>
            <PnlText value={snapshot.daily_pnl_eur} size="md" />
            <PnlText value={snapshot.daily_return_pct} format="percent" size="sm" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 sm:flex sm:gap-6">
          {periodReturns.map(({ label, value }) => (
            <div key={label} className="text-left sm:text-right">
              <p className="text-xs text-muted mb-1">{label}</p>
              <PnlText value={value} format="percent" size="md" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
