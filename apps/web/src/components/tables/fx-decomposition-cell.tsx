'use client';

import { formatPercent, pnlColor } from '@/lib/utils';

interface FxDecompositionCellProps {
  localReturn: number | null;
  fxImpact: number | null;
  totalReturn: number | null;
}

export function FxDecompositionCell({ localReturn, fxImpact, totalReturn }: FxDecompositionCellProps) {
  if (localReturn == null || fxImpact == null || totalReturn == null) {
    return <span className="text-muted">—</span>;
  }

  const localPct = Math.abs(localReturn);
  const fxPct = Math.abs(fxImpact);
  const total = localPct + fxPct || 1;

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-2 w-16 overflow-hidden rounded-full bg-border">
        <div
          className="h-full bg-[#4A90D9]"
          style={{ width: `${(localPct / total) * 100}%` }}
          title={`Local: ${formatPercent(localReturn)}`}
        />
        <div
          className="h-full bg-[#E67E22]"
          style={{ width: `${(fxPct / total) * 100}%` }}
          title={`FX: ${formatPercent(fxImpact)}`}
        />
      </div>
      <div className="flex gap-1.5 text-xs">
        <span className={pnlColor(localReturn)}>{formatPercent(localReturn, 1)}</span>
        <span className="text-muted">/</span>
        <span className={pnlColor(fxImpact)}>{formatPercent(fxImpact, 1)}</span>
      </div>
    </div>
  );
}
