'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import type { Tables, Views } from '@rivendell/supabase';
import type { Json } from '@rivendell/supabase';

const COLORS = ['#00D4AA', '#4A90D9', '#9B59B6', '#E67E22', '#FF4757', '#1ABC9C', '#FFD700', '#FF6B81'];

type TabKey = 'class' | 'sector' | 'region' | 'currency';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'class', label: 'Class' },
  { key: 'sector', label: 'Sector' },
  { key: 'region', label: 'Region' },
  { key: 'currency', label: 'Currency' },
];

interface AllocationChartProps {
  snapshot: Tables<'portfolio_snapshots'> | null;
  positions?: Views<'v_portfolio_current'>[];
}

function jsonToEntries(json: Json | null): { name: string; value: number }[] {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return [];
  return Object.entries(json as Record<string, number>)
    .filter(([, v]) => typeof v === 'number' && v > 0)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value);
}

function deriveAllocation(
  positions: Views<'v_portfolio_current'>[],
  key: TabKey,
): { name: string; value: number }[] {
  const openPositions = positions.filter((p) => p.quantity !== 0);
  const totalCost = openPositions.reduce((s, p) => s + Math.abs(p.total_cost_eur ?? 0), 0);
  if (totalCost === 0) return [];

  const groupMap: Record<string, number> = {};
  for (const p of openPositions) {
    let groupName: string;
    switch (key) {
      case 'class': groupName = p.asset_class ?? 'Unknown'; break;
      case 'sector': groupName = p.sector ?? 'Unknown'; break;
      case 'region': groupName = p.region ?? 'Unknown'; break;
      case 'currency': groupName = p.trading_currency ?? 'Unknown'; break;
    }
    groupMap[groupName] = (groupMap[groupName] ?? 0) + Math.abs(p.total_cost_eur ?? 0);
  }

  return Object.entries(groupMap)
    .map(([name, cost]) => ({ name, value: cost / totalCost }))
    .sort((a, b) => b.value - a.value);
}

export function AllocationChart({ snapshot, positions = [] }: AllocationChartProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('class');

  const allocationMap: Record<TabKey, Json | null> = {
    class: snapshot?.allocation_by_class ?? null,
    sector: snapshot?.allocation_by_sector ?? null,
    region: snapshot?.allocation_by_region ?? null,
    currency: snapshot?.allocation_by_currency ?? null,
  };

  // Use snapshot allocation if available, otherwise derive from positions
  const snapshotData = jsonToEntries(allocationMap[activeTab]);
  const data = snapshotData.length > 0 ? snapshotData : deriveAllocation(positions, activeTab);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Allocation</CardTitle>
        <div className="flex gap-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === key
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <ChartWrapper height={240} empty={data.length === 0} emptyMessage="No allocation data">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #2A2A3E', borderRadius: 8, fontSize: 12 }}
            formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Weight']}
          />
        </PieChart>
      </ChartWrapper>
      <div className="mt-3 flex flex-wrap gap-3">
        {data.slice(0, 6).map(({ name, value }, i) => (
          <div key={name} className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-text-secondary">{name}</span>
            <span className="font-mono text-text-primary">{(value * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
