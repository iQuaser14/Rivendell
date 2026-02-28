'use client';

import { useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge, assetClassBadge } from '@/components/ui/badge';
import { PnlText } from '@/components/ui/pnl-text';
import { FxDecompositionCell } from './fx-decomposition-cell';
import { formatCurrency, formatNumber, formatPercent, cn } from '@/lib/utils';
import type { Views } from '@rivendell/supabase';

type SortKey = 'ticker' | 'asset_class' | 'quantity' | 'market_value_eur' | 'unrealized_pnl_eur' | 'total_return_pct' | 'weight_pct';
type SortDir = 'asc' | 'desc';

interface PositionsTableProps {
  positions: Views<'v_portfolio_current'>[];
}

export function PositionsTable({ positions }: PositionsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('weight_pct');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...positions].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
  });

  if (positions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted">
        No positions yet. Import trades to get started.
      </div>
    );
  }

  const SortableHead = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-text-primary"
      onClick={() => handleSort(sortKeyName)}
    >
      {label}
      {sortKey === sortKeyName && (
        <span className="ml-1">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
      )}
    </TableHead>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead label="Ticker" sortKeyName="ticker" />
          <SortableHead label="Class" sortKeyName="asset_class" />
          <TableHead>CCY</TableHead>
          <SortableHead label="Qty" sortKeyName="quantity" />
          <TableHead className="text-right">Avg Cost</TableHead>
          <TableHead className="text-right">Mkt Price</TableHead>
          <SortableHead label="Mkt Value EUR" sortKeyName="market_value_eur" />
          <SortableHead label="Unreal. P&L" sortKeyName="unrealized_pnl_eur" />
          <TableHead>Return Decomposition</TableHead>
          <SortableHead label="Total Ret EUR" sortKeyName="total_return_pct" />
          <SortableHead label="Weight" sortKeyName="weight_pct" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((p) => (
          <TableRow key={p.asset_id}>
            <TableCell className="font-semibold text-text-primary">{p.ticker}</TableCell>
            <TableCell>
              <Badge variant={assetClassBadge(p.asset_class)}>{p.asset_class}</Badge>
            </TableCell>
            <TableCell className="text-text-secondary">{p.trading_currency}</TableCell>
            <TableCell className={cn(p.quantity < 0 && 'text-negative')}>
              {formatNumber(p.quantity, 0)}
            </TableCell>
            <TableCell className="text-right text-text-secondary">
              {formatNumber(p.avg_cost_local, 2)}
            </TableCell>
            <TableCell className="text-right">
              {p.market_price_local != null ? formatNumber(p.market_price_local, 2) : '—'}
            </TableCell>
            <TableCell className="text-right">{formatCurrency(p.market_value_eur)}</TableCell>
            <TableCell className="text-right">
              <PnlText value={p.unrealized_pnl_eur} size="sm" />
            </TableCell>
            <TableCell>
              <FxDecompositionCell
                localReturn={p.local_return_pct}
                fxImpact={p.fx_impact_pct}
                totalReturn={p.total_return_pct}
              />
            </TableCell>
            <TableCell className="text-right">
              <PnlText value={p.total_return_pct} format="percent" size="sm" />
            </TableCell>
            <TableCell className="text-right">
              {p.weight_pct != null ? formatPercent(p.weight_pct, 1) : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
