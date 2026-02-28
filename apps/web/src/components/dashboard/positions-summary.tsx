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
  const totalValue = positions.reduce((s, p) => s + (p.market_value_eur ?? 0), 0);
  const totalPnl = positions.reduce((s, p) => s + (p.unrealized_pnl_eur ?? 0), 0);

  const stats = [
    { label: 'Positions', value: count.toString() },
    { label: 'Long', value: longs.toString() },
    { label: 'Short', value: shorts.toString() },
  ];

  return (
    <Card className="flex items-center justify-between">
      <div className="flex gap-8">
        {stats.map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted">{label}</p>
            <p className="font-mono text-lg font-semibold text-text-primary">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-8">
        <div className="text-right">
          <p className="text-xs text-muted">Market Value</p>
          <p className="font-mono text-lg font-semibold text-text-primary">{formatCurrency(totalValue)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Total P&L</p>
          <PnlText value={totalPnl} size="lg" />
        </div>
      </div>
    </Card>
  );
}
