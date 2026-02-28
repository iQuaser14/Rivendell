'use client';

import { ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReactNode } from 'react';

interface ChartWrapperProps {
  height?: number;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
}

export function ChartWrapper({ height = 300, loading, empty, emptyMessage = 'No data available', children }: ChartWrapperProps) {
  if (loading) {
    return <Skeleton className="w-full" style={{ height }} />;
  }

  if (empty) {
    return (
      <div className="flex items-center justify-center text-sm text-muted" style={{ height }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {children as React.ReactElement}
    </ResponsiveContainer>
  );
}
