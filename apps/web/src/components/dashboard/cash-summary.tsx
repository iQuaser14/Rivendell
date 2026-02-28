'use client';

import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { Views } from '@rivendell/supabase';

const COLORS = ['#00D4AA', '#4A90D9', '#9B59B6', '#E67E22', '#FF4757', '#1ABC9C', '#FFD700', '#FF6B81', '#2ECC71'];

interface CashSummaryProps {
  cashAccounts: Views<'v_cash_summary'>[];
}

export function CashSummary({ cashAccounts }: CashSummaryProps) {
  const totalEur = cashAccounts.reduce((s, a) => s + (a.balance_eur ?? 0), 0);
  const nonZero = cashAccounts.filter((a) => Math.abs(a.balance) > 0.01);
  const chartData = nonZero.map((a) => ({
    name: a.currency,
    value: Math.abs(a.balance_eur ?? 0),
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Cash Balances</CardTitle></CardHeader>
        <div className="mb-4">
          <p className="text-sm uppercase tracking-wider text-muted">Total Cash (EUR)</p>
          <p className="font-mono text-3xl md:text-4xl font-bold text-text-primary">
            {formatCurrency(totalEur)}
          </p>
        </div>
        {cashAccounts.length === 0 ? (
          <p className="text-sm text-muted">No cash data</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">FX Rate</TableHead>
                <TableHead className="text-right">EUR Equiv.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashAccounts.map((a) => (
                <TableRow key={a.currency}>
                  <TableCell className="font-semibold text-text-primary">{a.currency}</TableCell>
                  <TableCell className="text-right">{formatNumber(a.balance, 2)}</TableCell>
                  <TableCell className="text-right text-text-secondary">
                    {a.currency === 'EUR' ? '1.0000' : formatNumber(a.fx_rate_to_eur, 4)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(a.balance_eur)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader><CardTitle>Currency Allocation</CardTitle></CardHeader>
        <ChartWrapper height={280} empty={chartData.length === 0} emptyMessage="No cash positions">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #2A2A3E', borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => [formatCurrency(value), 'EUR Equiv.']}
            />
          </PieChart>
        </ChartWrapper>
      </Card>
    </div>
  );
}
