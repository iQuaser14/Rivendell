'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import type { Tables } from '@rivendell/supabase';

interface DailyPnlChartProps {
  snapshots: Tables<'portfolio_snapshots'>[];
}

export function DailyPnlChart({ snapshots }: DailyPnlChartProps) {
  const recent = snapshots.slice(-30);
  const chartData = recent.map((s) => ({
    date: s.snapshot_date,
    pnl: s.daily_pnl_eur ?? 0,
  }));

  return (
    <Card>
      <CardHeader><CardTitle>Daily P&L</CardTitle></CardHeader>
      <ChartWrapper height={200} empty={chartData.length === 0} emptyMessage="No P&L data">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3E" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8888AA' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#8888AA' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #2A2A3E', borderRadius: 8, fontSize: 12 }}
            formatter={(value: number) => [`€${value.toFixed(2)}`, 'P&L']}
          />
          <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.pnl >= 0 ? '#00D4AA' : '#FF4757'} />
            ))}
          </Bar>
        </BarChart>
      </ChartWrapper>
    </Card>
  );
}
