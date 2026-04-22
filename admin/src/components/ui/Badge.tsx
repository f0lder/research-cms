'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => {
    const baseStyles = 'font-label uppercase tracking-widest inline-flex items-center gap-2 border-2 border-on-surface';

    const variantStyles = {
      default: 'bg-surface-container text-on-surface',
      primary: 'bg-primary text-white',
      success: 'bg-green-500 text-white',
      error: 'bg-red-600 text-white',
      warning: 'bg-yellow-500 text-black',
    };

    const sizeStyles = {
      sm: 'px-2 py-1 text-[10px]',
      md: 'px-4 py-2 text-sm',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
