'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { PnlText } from '@/components/ui/pnl-text';
import { formatCurrency } from '@/lib/utils';
import type { Views } from '@rivendell/supabase';

interface TopContributorsProps {
  positions: Views<'v_portfolio_current'>[];
}

export function TopContributors({ positions }: TopContributorsProps) {
  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Top Contributors</CardTitle></CardHeader>
        <p className="text-sm text-muted">No positions</p>
      </Card>
    );
  }

  const hasPnl = positions.some((p) => p.unrealized_pnl_eur != null);

  if (hasPnl) {
    const sorted = [...positions]
      .filter((p) => p.unrealized_pnl_eur != null)
      .sort((a, b) => (b.unrealized_pnl_eur ?? 0) - (a.unrealized_pnl_eur ?? 0));

    const gainers = sorted.slice(0, 5);
    const losers = sorted.slice(-5).reverse();

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

  // Fallback: show largest positions by cost basis
  const sorted = [...positions]
    .filter((p) => p.quantity !== 0)
    .sort((a, b) => Math.abs(b.total_cost_eur ?? 0) - Math.abs(a.total_cost_eur ?? 0));

  const longs = sorted.filter((p) => p.quantity > 0).slice(0, 5);
  const shorts = sorted.filter((p) => p.quantity < 0).slice(0, 5);

  return (
    <Card>
      <CardHeader><CardTitle>Largest Positions</CardTitle></CardHeader>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-positive">Longs</p>
          {longs.map((p) => (
            <div key={p.asset_id} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-text-primary">{p.ticker}</span>
              <span className="text-xs font-mono text-text-secondary">{formatCurrency(p.total_cost_eur)}</span>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-negative">Shorts</p>
          {shorts.map((p) => (
            <div key={p.asset_id} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-text-primary">{p.ticker}</span>
              <span className="text-xs font-mono text-text-secondary">{formatCurrency(p.total_cost_eur)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
