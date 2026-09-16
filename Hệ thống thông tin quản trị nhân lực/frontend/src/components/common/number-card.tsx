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
        'group relative flex flex-col justify-between rounded-lg border border-border bg-card p-6 shadow-xs transition-all duration-150 ease-out hover:border-foreground/20',
        onClick && 'cursor-pointer hover:shadow-sm',
        className,
      )}
    >
      <div>
        <div className="flex items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-muted-foreground tracking-tight truncate">{title}</span>
          {Icon && (
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>

        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-2xl font-bold tracking-tight text-foreground font-tabular-nums">{value}</span>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium',
                trend.isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {trend.isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {trend.value}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground truncate leading-normal">
          {subtitle} {trend?.label && <span className="text-muted-foreground/70">· {trend.label}</span>}
        </p>
      )}
    </div>
  );
}
