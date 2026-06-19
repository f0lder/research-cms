'use client';

import { Fragment, ReactNode } from 'react';
import Link from 'next/link';
import { LuChevronRight } from 'react-icons/lu';
import type { IconType } from 'react-icons';

export interface BreadcrumbItem {
  label: ReactNode;
  /** When set (and not the last item), the crumb is a link. */
  href?: string;
  /** Optional leading icon (react-icons component). */
  icon?: IconType;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Standardized breadcrumb trail for admin pages.
 * - Lucide icons + chevron separators.
 * - Intermediate items with `href` are links; the last item is the current page.
 */
export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`breadcrumb ${className}`}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const Icon = item.icon;
        const inner = (
          <>
            {Icon && <Icon className="text-[13px] shrink-0" aria-hidden />}
            <span>{item.label}</span>
          </>
        );

        return (
          <Fragment key={i}>
            {i > 0 && (
              <LuChevronRight className="text-on-surface-variant/50 shrink-0 text-[13px]" aria-hidden />
            )}
            {item.href && !isLast ? (
              <Link href={item.href}>{inner}</Link>
            ) : (
              <span
                className={`inline-flex items-center gap-1 ${isLast ? 'text-on-surface' : ''}`}
                aria-current={isLast ? 'page' : undefined}
              >
                {inner}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
