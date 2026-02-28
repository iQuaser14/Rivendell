'use client';

import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { PnlText } from '@/components/ui/pnl-text';
import type { Views } from '@rivendell/supabase';

interface PositionsSummaryProps {
  positions: Views<'v_portfolio_current'>[];
}

export function PositionsSummary({ positions }: PositionsSummaryProps) {
  const count = positions.length;
  const longs = positions.filter((p) => p.quantity > 0).length;
  const shorts = positions.filter((p) => p.quantity < 0).length;
  const hasMarketValues = positions.some((p) => p.market_value_eur != null);
  const totalValue = positions.reduce((s, p) => s + (p.market_value_eur ?? 0), 0);
  const totalCost = positions.reduce((s, p) => s + (p.total_cost_eur ?? 0), 0);
  const totalPnl = positions.reduce((s, p) => s + (p.unrealized_pnl_eur ?? 0), 0);

  const stats = [
    { label: 'Positions', value: count.toString() },
    { label: 'Long', value: longs.toString() },
    { label: 'Short', value: shorts.toString() },
  ];

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-8">
        {stats.map(({ label, value }) => (
          <div key={label}>
            <p className="text-sm text-muted">{label}</p>
            <p className="font-mono text-xl font-semibold text-text-primary">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-8">
        <div className="sm:text-right">
          <p className="text-sm text-muted">{hasMarketValues ? 'Market Value' : 'Cost Basis'}</p>
          <p className="font-mono text-xl font-semibold text-text-primary">
            {formatCurrency(hasMarketValues ? totalValue : totalCost)}
          </p>
        </div>
        {hasMarketValues ? (
          <div className="sm:text-right">
            <p className="text-sm text-muted">Total P&L</p>
            <PnlText value={totalPnl} size="lg" />
          </div>
        ) : (
          <div className="sm:text-right">
            <p className="text-sm text-muted">Realized P&L</p>
            <PnlText
              value={positions.reduce((s, p) => s + (p.realized_pnl_eur ?? 0), 0)}
              size="lg"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
