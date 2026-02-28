'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { PnlText } from '@/components/ui/pnl-text';
import type { Views } from '@rivendell/supabase';

interface TopContributorsProps {
  positions: Views<'v_portfolio_current'>[];
}

export function TopContributors({ positions }: TopContributorsProps) {
  const sorted = [...positions]
    .filter((p) => p.unrealized_pnl_eur != null)
    .sort((a, b) => (b.unrealized_pnl_eur ?? 0) - (a.unrealized_pnl_eur ?? 0));

  const gainers = sorted.slice(0, 5);
  const losers = sorted.slice(-5).reverse();

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Top Contributors</CardTitle></CardHeader>
        <p className="text-sm text-muted">No positions</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Top Contributors</CardTitle></CardHeader>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-positive">Gainers</p>
          {gainers.map((p) => (
            <div key={p.asset_id} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-text-primary">{p.ticker}</span>
              <PnlText value={p.unrealized_pnl_eur} size="sm" />
            </div>
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-negative">Losers</p>
          {losers.map((p) => (
            <div key={p.asset_id} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-text-primary">{p.ticker}</span>
              <PnlText value={p.unrealized_pnl_eur} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
