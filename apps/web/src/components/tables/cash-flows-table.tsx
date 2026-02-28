'use client';

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge, flowTypeBadge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface CashFlowWithAsset {
  id: string;
  flow_date: string;
  flow_type: string;
  amount: number;
  currency: string;
  fx_rate_to_eur: number | null;
  amount_eur: number | null;
  notes: string | null;
  assets: { ticker: string; name: string | null } | null;
}

interface CashFlowsTableProps {
  flows: CashFlowWithAsset[];
}

export function CashFlowsTable({ flows }: CashFlowsTableProps) {
  if (flows.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted">
        No cash flows recorded.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>CCY</TableHead>
          <TableHead className="text-right">EUR Amount</TableHead>
          <TableHead>Asset</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {flows.map((f) => (
          <TableRow key={f.id}>
            <TableCell className="text-text-secondary">{f.flow_date}</TableCell>
            <TableCell>
              <Badge variant={flowTypeBadge(f.flow_type)}>{f.flow_type}</Badge>
            </TableCell>
            <TableCell className="text-right">{formatNumber(f.amount, 2)}</TableCell>
            <TableCell className="text-text-secondary">{f.currency}</TableCell>
            <TableCell className="text-right">{formatCurrency(f.amount_eur)}</TableCell>
            <TableCell className="text-text-secondary">{f.assets?.ticker ?? '—'}</TableCell>
            <TableCell className="max-w-[200px] truncate text-text-secondary text-xs">
              {f.notes ?? '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
