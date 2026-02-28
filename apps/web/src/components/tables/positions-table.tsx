'use client';

import { useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge, assetClassBadge } from '@/components/ui/badge';
import { PnlText } from '@/components/ui/pnl-text';
import { Button } from '@/components/ui/button';
import { FxDecompositionCell } from './fx-decomposition-cell';
import { formatCurrency, formatNumber, formatPercent, cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { Views } from '@rivendell/supabase';

type SortKey = 'ticker' | 'asset_class' | 'quantity' | 'market_value_eur' | 'unrealized_pnl_eur' | 'total_return_pct' | 'weight_pct';
type SortDir = 'asc' | 'desc';

interface PositionsTableProps {
  positions: Views<'v_portfolio_current'>[];
  onQuickSell?: (position: Views<'v_portfolio_current'>) => void;
}

export function PositionsTable({ positions, onQuickSell }: PositionsTableProps) {
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
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-xl font-semibold text-text-primary">No positions yet</p>
        <p className="text-sm text-muted">Import trades or add your first position to get started.</p>
        <Link href="/trades">
          <Button size="lg">
            <Plus className="h-5 w-5 mr-2" /> Add Trade
          </Button>
        </Link>
      </div>
    );
  }

  const SortableHead = ({ label, sortKeyName, className: extraClass }: { label: string; sortKeyName: SortKey; className?: string }) => (
    <TableHead
      className={cn(
        'cursor-pointer select-none hover:text-text-primary',
        extraClass,
      )}
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
          <SortableHead label="Ticker" sortKeyName="ticker" className="min-w-[100px]" />
          <TableHead className="min-w-[120px]">Name</TableHead>
          <SortableHead label="Qty" sortKeyName="quantity" className="text-right min-w-[80px]" />
          <TableHead className="text-right min-w-[100px]">Avg Cost</TableHead>
          <TableHead className="min-w-[60px]">CCY</TableHead>
          <TableHead className="text-right min-w-[100px]">Mkt Price</TableHead>
          <SortableHead label="Mkt Value" sortKeyName="market_value_eur" className="text-right min-w-[120px]" />
          <SortableHead label="Unrealized P&L" sortKeyName="unrealized_pnl_eur" className="text-right min-w-[120px]" />
          <TableHead className="text-right min-w-[80px]">P&L %</TableHead>
          <TableHead className="text-right min-w-[90px]">Local Ret</TableHead>
          <TableHead className="text-right min-w-[80px]">FX Impact</TableHead>
          <SortableHead label="Weight" sortKeyName="weight_pct" className="text-right min-w-[80px]" />
          {onQuickSell && <TableHead className="min-w-[70px]" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((p) => (
          <TableRow key={p.asset_id}>
            <TableCell className="font-semibold text-text-primary">{p.ticker}</TableCell>
            <TableCell className="text-text-secondary font-sans text-sm">{p.name ?? '—'}</TableCell>
            <TableCell className={cn('text-right', p.quantity < 0 && 'text-negative')}>
              {formatNumber(p.quantity, 0)}
            </TableCell>
            <TableCell className="text-right text-text-secondary">
              {formatNumber(p.avg_cost_local, 2)}
            </TableCell>
            <TableCell className="text-text-secondary">{p.trading_currency}</TableCell>
            <TableCell className="text-right">
              {p.market_price_local != null ? formatNumber(p.market_price_local, 2) : '—'}
            </TableCell>
            <TableCell className="text-right">{formatCurrency(p.market_value_eur)}</TableCell>
            <TableCell className="text-right">
              <PnlText value={p.unrealized_pnl_eur} size="sm" />
            </TableCell>
            <TableCell className="text-right">
              <PnlText value={p.unrealized_pnl_pct} format="percent" size="sm" />
            </TableCell>
            <TableCell className="text-right">
              <PnlText value={p.local_return_pct} format="percent" size="sm" />
            </TableCell>
            <TableCell className="text-right">
              <PnlText value={p.fx_impact_pct} format="percent" size="sm" />
            </TableCell>
            <TableCell className="text-right">
              {p.weight_pct != null ? formatPercent(p.weight_pct, 1) : '—'}
            </TableCell>
            {onQuickSell && (
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onQuickSell(p)}
                >
                  {p.quantity > 0 ? 'Sell' : 'Cover'}
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
