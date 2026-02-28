'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercent, pnlColor } from '@/lib/utils';
import type { Tables } from '@rivendell/supabase';

interface RiskMetricsCardProps {
  snapshot: Tables<'portfolio_snapshots'> | null;
}

function MetricRow({ label, value, format = 'percent' }: { label: string; value: number | null; format?: 'percent' | 'ratio' }) {
  const display = value == null
    ? '—'
    : format === 'ratio'
      ? value.toFixed(2)
      : formatPercent(value);

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className={`font-mono text-sm ${format === 'ratio' ? pnlColor(value) : pnlColor(value)}`}>
        {display}
      </span>
    </div>
  );
}

export function RiskMetricsCard({ snapshot }: RiskMetricsCardProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Risk Metrics</CardTitle></CardHeader>
      {!snapshot ? (
        <p className="text-sm text-muted">No data</p>
      ) : (
        <div className="divide-y divide-border/50">
          <MetricRow label="Volatility (30d)" value={snapshot.volatility_30d} />
          <MetricRow label="Sharpe (YTD)" value={snapshot.sharpe_ratio_ytd} format="ratio" />
          <MetricRow label="Sortino (YTD)" value={snapshot.sortino_ratio_ytd} format="ratio" />
          <MetricRow label="Max DD (YTD)" value={snapshot.max_drawdown_ytd} />
          <MetricRow label="Current DD" value={snapshot.current_drawdown} />
        </div>
      )}
    </Card>
  );
}
