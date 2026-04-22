'use client';

import React from 'react';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'xs' | 'sm' | 'md' | 'lg';
  responsive?: boolean;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ columns = 1, gap = 'md', responsive = true, className = '', children, ...props }, ref) => {
    const gapStyles = {
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
    };

    const columnStyles = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      12: 'grid-cols-12',
    };

    const responsiveClass = responsive
      ? `lg:${columnStyles[columns]} md:grid-cols-${Math.min(columns, 3)} sm:grid-cols-${Math.min(columns, 2)} grid-cols-1`
      : columnStyles[columns];

    return (
      <div
        ref={ref}
        className={`grid ${responsiveClass} ${gapStyles[gap]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';
