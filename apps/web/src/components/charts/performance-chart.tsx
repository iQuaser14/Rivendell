'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import type { Tables } from '@rivendell/supabase';

type Range = '1W' | '1M' | '3M' | 'YTD' | '1Y' | 'All';
const ranges: Range[] = ['1W', '1M', '3M', 'YTD', '1Y', 'All'];

interface PerformanceChartProps {
  snapshots: Tables<'portfolio_snapshots'>[];
}

function filterByRange(data: Tables<'portfolio_snapshots'>[], range: Range): Tables<'portfolio_snapshots'>[] {
  if (range === 'All' || data.length === 0) return data;
  const now = new Date();
  let cutoff: Date;
  switch (range) {
    case '1W': cutoff = new Date(now.getTime() - 7 * 86400000); break;
    case '1M': cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
    case '3M': cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); break;
    case 'YTD': cutoff = new Date(now.getFullYear(), 0, 1); break;
    case '1Y': cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
  }
  return data.filter((s) => new Date(s.snapshot_date) >= cutoff);
}

export function PerformanceChart({ snapshots }: PerformanceChartProps) {
  const [range, setRange] = useState<Range>('YTD');
  const filtered = filterByRange(snapshots, range);
  const chartData = filtered.map((s) => ({
    date: s.snapshot_date,
    twr: (s.cumulative_twr ?? 0) * 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance (TWR)</CardTitle>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                range === r ? 'bg-accent/10 text-accent' : 'text-muted hover:text-text-primary'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </CardHeader>
      <ChartWrapper height={300} empty={chartData.length === 0} emptyMessage="No performance data">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="twrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3E" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8888AA' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#8888AA' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #2A2A3E', borderRadius: 8, fontSize: 12 }}
            formatter={(value: number) => [`${value.toFixed(2)}%`, 'TWR']}
          />
          <Area type="monotone" dataKey="twr" stroke="#00D4AA" fill="url(#twrGradient)" strokeWidth={2} />
        </AreaChart>
      </ChartWrapper>
    </Card>
  );
}
