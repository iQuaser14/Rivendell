'use client';

import { useEffect, useState } from 'react';
import { isAnyMarketOpen } from '@rivendell/core';

interface MarketStatusProps {
  exchanges: string[];
  lastUpdated: Date | null;
}

type Status = 'live' | 'delayed' | 'closed';

function getStatus(exchanges: string[], lastUpdated: Date | null): Status {
  const marketsOpen = isAnyMarketOpen(exchanges);
  if (!marketsOpen) return 'closed';

  if (!lastUpdated) return 'delayed';

  const ageMs = Date.now() - lastUpdated.getTime();
  // >2 minutes since last update = delayed
  if (ageMs > 2 * 60 * 1000) return 'delayed';

  return 'live';
}

const STATUS_CONFIG: Record<Status, { dot: string; label: string; color: string }> = {
  live:    { dot: 'bg-positive', label: 'Live', color: 'text-positive' },
  delayed: { dot: 'bg-warning',  label: 'Delayed', color: 'text-warning' },
  closed:  { dot: 'bg-negative', label: 'Closed', color: 'text-text-secondary' },
};

export function MarketStatus({ exchanges, lastUpdated }: MarketStatusProps) {
  const [status, setStatus] = useState<Status>(() => getStatus(exchanges, lastUpdated));

  useEffect(() => {
    setStatus(getStatus(exchanges, lastUpdated));
    // Re-check every 30 seconds
    const interval = setInterval(() => {
      setStatus(getStatus(exchanges, lastUpdated));
    }, 30_000);
    return () => clearInterval(interval);
  }, [exchanges, lastUpdated]);

  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={`inline-block h-2 w-2 rounded-full ${config.dot} ${status === 'live' ? 'animate-pulse' : ''}`} />
      <span className={config.color}>{config.label}</span>
    </div>
  );
}
