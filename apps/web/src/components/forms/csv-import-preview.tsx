'use client';

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';
import type { ParsedTrade, ParsedDividend } from '@rivendell/core';

interface CsvImportPreviewProps {
  rows: (ParsedTrade | ParsedDividend)[];
  selected: Set<number>;
  onToggle: (index: number) => void;
  onToggleAll: () => void;
}

function isTrade(row: ParsedTrade | ParsedDividend): row is ParsedTrade {
  return 'side' in row;
}

export function CsvImportPreview({ rows, selected, onToggle, onToggleAll }: CsvImportPreviewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8">
            <input
              type="checkbox"
              checked={selected.size === rows.length}
              onChange={onToggleAll}
              className="rounded border-border"
            />
          </TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Ticker</TableHead>
          <TableHead>ISIN</TableHead>
          <TableHead>CCY</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
            <TableRow key={i} className={selected.has(i) ? '' : 'opacity-40'}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => onToggle(i)}
                  className="rounded border-border"
                />
              </TableCell>
              <TableCell>
                {isTrade(row)
                  ? <Badge variant={row.side === 'BUY' ? 'buy' : 'sell'}>{row.side}</Badge>
                  : <Badge variant="dividend">DIV</Badge>
                }
              </TableCell>
              <TableCell className="text-text-secondary">
                {isTrade(row) ? String(row.tradeDate) : String((row as ParsedDividend).flowDate)}
              </TableCell>
              <TableCell className="font-semibold text-text-primary">{row.ticker}</TableCell>
              <TableCell className="text-text-secondary text-xs">{row.isin ?? '—'}</TableCell>
              <TableCell>{row.currency}</TableCell>
              <TableCell className="text-right">
                {isTrade(row) ? formatNumber(row.quantity, 0) : '—'}
              </TableCell>
              <TableCell className="text-right">
                {isTrade(row) ? formatNumber(row.price, 2) : '—'}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(row.amount, 2)}
              </TableCell>
            </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
