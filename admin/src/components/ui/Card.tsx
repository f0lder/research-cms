'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'filled';
  interactive?: boolean;
  selected?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'outlined', interactive = false, selected = false, className = '', children, ...props }, ref) => {
    const baseStyles = 'bg-surface border-2 border-black p-4';

    const variantStyles = {
      elevated: 'shadow-hard',
      outlined: 'border-2',
      filled: 'bg-surface-container border-2',
    };

    const interactiveStyles = interactive ? 'cursor-pointer hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-hard transition-all' : '';
    const selectedStyles = selected ? 'ring-2 ring-primary shadow-hard-orange border-primary' : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${interactiveStyles} ${selectedStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
