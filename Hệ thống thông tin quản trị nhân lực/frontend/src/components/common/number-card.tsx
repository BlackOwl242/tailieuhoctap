'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NumberCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate';
  className?: string;
  onClick?: () => void;
}

export function NumberCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  onClick,
}: NumberCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border border-border/60 bg-card p-4 transition-all duration-150 ease-out hover:border-border hover:bg-card/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)]',
        onClick && 'cursor-pointer hover:shadow-xs',
        className,
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 pb-2">
          <span className="text-xs font-medium text-muted-foreground truncate">{title}</span>
          {Icon && (
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50 text-muted-foreground transition-colors group-hover:text-foreground group-hover:bg-muted">
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground font-tabular-nums">{value}</span>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.2 rounded-md',
                trend.isPositive
                  ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
                  : 'text-rose-700 bg-rose-500/10 dark:text-rose-400',
              )}
            >
              {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="mt-2 text-[11px] text-muted-foreground/80 truncate leading-normal">
          {subtitle} {trend?.label && <span className="text-muted-foreground/60">· {trend.label}</span>}
        </p>
      )}
    </div>
  );
}
