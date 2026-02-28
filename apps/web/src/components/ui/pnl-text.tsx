import { cn, formatCurrency, formatPercent, pnlColor } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

interface PnlTextProps extends HTMLAttributes<HTMLSpanElement> {
  value: number | null | undefined;
  format?: 'currency' | 'percent';
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeStyles = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-2xl',
};

export function PnlText({ value, format = 'currency', currency = 'EUR', size = 'md', className, ...props }: PnlTextProps) {
  const display = format === 'percent'
    ? formatPercent(value)
    : formatCurrency(value, currency);

  return (
    <span
      className={cn('font-mono font-medium', pnlColor(value), sizeStyles[size], className)}
      {...props}
    >
      {display}
    </span>
  );
}
