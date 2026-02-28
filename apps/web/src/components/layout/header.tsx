import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  actions?: ReactNode;
}

export function Header({ title, actions, className, ...props }: HeaderProps) {
  return (
    <header
      className={cn('flex h-14 items-center justify-between border-b border-border px-6', className)}
      {...props}
    >
      <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
