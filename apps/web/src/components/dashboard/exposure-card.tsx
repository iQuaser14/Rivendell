'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Tables } from '@rivendell/supabase';

interface ExposureCardProps {
  snapshot: Tables<'portfolio_snapshots'> | null;
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

export function ExposureCard({ snapshot }: ExposureCardProps) {
  if (!snapshot) {
    return (
      <Card>
        <CardHeader><CardTitle>Exposure</CardTitle></CardHeader>
        <p className="text-sm text-muted">No data</p>
      </Card>
    );
  }

  const gross = snapshot.gross_exposure ?? 0;

  return (
    <Card>
      <CardHeader><CardTitle>Exposure</CardTitle></CardHeader>
      <div className="space-y-4">
        <ExposureBar label="Long" value={snapshot.long_exposure ?? 0} total={gross} color="#00D4AA" />
        <ExposureBar label="Short" value={snapshot.short_exposure ?? 0} total={gross} color="#FF4757" />
        <div className="flex justify-between border-t border-border pt-3 text-xs">
          <div>
            <span className="text-muted">Gross</span>
            <p className="font-mono text-sm text-text-primary">{formatCurrency(gross)}</p>
          </div>
          <div className="text-right">
            <span className="text-muted">Net</span>
            <p className="font-mono text-sm text-text-primary">{formatCurrency(snapshot.net_exposure ?? 0)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
