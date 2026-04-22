'use client';

import React from 'react';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4;
  variant?: 'display' | 'h1' | 'h2' | 'h3' | 'label';
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 1, variant, className = '', children, ...props }, ref) => {
    const effectiveVariant = variant || (level === 1 ? 'h1' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'label');

    const sizeStyles = {
      display: 'text-display font-display',
      h1: 'text-h1 font-heading',
      h2: 'text-h2 font-heading',
      h3: 'text-h3 font-heading',
      label: 'text-label font-heading',
    };

    const Tag = `h${level}` as const;

    return (
      <Tag
        ref={ref as any}
        className={`${sizeStyles[effectiveVariant]} text-on-surface uppercase tracking-tight ${className}`}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

Heading.displayName = 'Heading';
