'use client';

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge, tradeSideBadge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface TradeWithAsset {
  id: string;
  trade_date: string;
  side: string;
  quantity: number;
  price: number;
  currency: string;
  fx_rate_to_eur: number;
  gross_amount_eur: number;
  commission: number;
  net_amount_eur: number;
  source: string;
  assets: { ticker: string; name: string | null; asset_class: string; currency: string } | null;
}

interface TradesTableProps {
  trades: TradeWithAsset[];
}

export function TradesTable({ trades }: TradesTableProps) {
  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted">
        No trades yet. Add a trade or import a CSV file.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Ticker</TableHead>
          <TableHead>Side</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead>CCY</TableHead>
          <TableHead className="text-right">FX Rate</TableHead>
          <TableHead className="text-right">Gross EUR</TableHead>
          <TableHead className="text-right">Comm.</TableHead>
          <TableHead className="text-right">Net EUR</TableHead>
          <TableHead>Source</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="text-text-secondary">{t.trade_date}</TableCell>
            <TableCell className="font-semibold text-text-primary">
              {t.assets?.ticker ?? '—'}
            </TableCell>
            <TableCell>
              <Badge variant={tradeSideBadge(t.side)}>{t.side}</Badge>
            </TableCell>
            <TableCell className="text-right">{formatNumber(t.quantity, 0)}</TableCell>
            <TableCell className="text-right">{formatNumber(t.price, 2)}</TableCell>
            <TableCell className="text-text-secondary">{t.currency}</TableCell>
            <TableCell className="text-right">{formatNumber(t.fx_rate_to_eur, 4)}</TableCell>
            <TableCell className="text-right">{formatCurrency(t.gross_amount_eur)}</TableCell>
            <TableCell className="text-right">{formatNumber(t.commission, 2)}</TableCell>
            <TableCell className="text-right">{formatCurrency(t.net_amount_eur)}</TableCell>
            <TableCell>
              <Badge variant="default">{t.source}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
