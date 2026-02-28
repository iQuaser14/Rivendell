import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'buy' | 'sell' | 'short' | 'cover' | 'deposit' | 'withdrawal' | 'dividend' | 'equity' | 'etf' | 'bond' | 'option';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-border text-text-secondary',
  buy: 'bg-positive-dim text-positive',
  sell: 'bg-negative-dim text-negative',
  short: 'bg-negative-dim text-negative',
  cover: 'bg-positive-dim text-positive',
  deposit: 'bg-positive-dim text-positive',
  withdrawal: 'bg-negative-dim text-negative',
  dividend: 'bg-[#FFD70033] text-[#FFD700]',
  equity: 'bg-[#4A90D933] text-[#4A90D9]',
  etf: 'bg-[#9B59B633] text-[#9B59B6]',
  bond: 'bg-[#E67E2233] text-[#E67E22]',
  option: 'bg-[#1ABC9C33] text-[#1ABC9C]',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function tradeSideBadge(side: string): BadgeVariant {
  const s = side.toUpperCase();
  if (s === 'BUY') return 'buy';
  if (s === 'SELL') return 'sell';
  if (s === 'SHORT') return 'short';
  if (s === 'COVER') return 'cover';
  return 'default';
}

export function flowTypeBadge(type: string): BadgeVariant {
  if (type === 'deposit') return 'deposit';
  if (type === 'withdrawal') return 'withdrawal';
  if (type === 'dividend') return 'dividend';
  return 'default';
}

export function assetClassBadge(cls: string): BadgeVariant {
  if (cls === 'equity') return 'equity';
  if (cls === 'etf') return 'etf';
  if (cls === 'bond') return 'bond';
  if (cls === 'option') return 'option';
  return 'default';
}
