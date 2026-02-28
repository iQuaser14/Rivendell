import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  actions?: ReactNode;
}

export function Header({ title, actions, className, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b border-border px-4 md:px-6',
        className,
      )}
      {...props}
    >
      {/* Left spacer for mobile hamburger */}
      <div className="flex items-center gap-3">
        <div className="w-8 md:hidden" />
        <h1 className="text-base md:text-lg font-semibold text-text-primary">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
