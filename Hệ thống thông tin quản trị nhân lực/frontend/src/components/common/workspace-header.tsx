'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface WorkspaceHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  };
  actions?: React.ReactNode;
  className?: string;
}

export function WorkspaceHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: WorkspaceHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-2 pb-4 border-b border-border mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            HRMIS
          </Link>
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              {b.href ? (
                <Link href={b.href} className="hover:text-foreground transition-colors truncate">
                  {b.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground truncate">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-3 2xl:grid-cols-[minmax(0,1fr)_auto] 2xl:items-center">
        <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {actions && <div className="min-w-0 max-w-full">{actions}</div>}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground max-w-3xl leading-normal">{description}</p>
      )}
    </div>
  );
}
