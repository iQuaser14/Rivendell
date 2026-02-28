'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Tables, Views } from '@rivendell/supabase';

interface ExposureCardProps {
  snapshot: Tables<'portfolio_snapshots'> | null;
  positions?: Views<'v_portfolio_current'>[];
}

function ExposureBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.abs(value) / total : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono text-text-primary">{formatCurrency(value)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-border">
        <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function ExposureCard({ snapshot, positions = [] }: ExposureCardProps) {
  // Derive exposure from positions if snapshot doesn't have it
  let longExp = snapshot?.long_exposure ?? 0;
  let shortExp = snapshot?.short_exposure ?? 0;

  if (!longExp && !shortExp && positions.length > 0) {
    for (const p of positions) {
      const cost = Math.abs(p.total_cost_eur ?? 0);
      if (p.quantity > 0) longExp += cost;
      else if (p.quantity < 0) shortExp += cost;
    }
  }

  const gross = longExp + shortExp;
  const net = longExp - shortExp;

  if (gross === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Exposure</CardTitle></CardHeader>
        <p className="text-sm text-muted">No data</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Exposure</CardTitle></CardHeader>
      <div className="space-y-4">
        <ExposureBar label="Long" value={longExp} total={gross} color="#00D4AA" />
        <ExposureBar label="Short" value={shortExp} total={gross} color="#FF4757" />
        <div className="flex justify-between border-t border-border pt-3 text-xs">
          <div>
            <span className="text-muted">Gross</span>
            <p className="font-mono text-sm text-text-primary">{formatCurrency(gross)}</p>
          </div>
          <div className="text-right">
            <span className="text-muted">Net</span>
            <p className="font-mono text-sm text-text-primary">{formatCurrency(net)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
