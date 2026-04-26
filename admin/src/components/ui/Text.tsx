'use client';

import React from 'react';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'body-lg' | 'body-md' | 'body-sm' | 'label' | 'code' | 'caption';
  color?: 'default' | 'secondary' | 'error';
  as?: React.ElementType;
}

export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ variant = 'body-md', color = 'default', as: Component = 'p', className = '', children, ...props }, ref) => {
    const sizeStyles = {
      'body-lg': 'text-body-lg font-body',
      'body-md': 'text-body-md font-body',
      'body-sm': 'text-body-sm font-body',
      'label': 'text-label font-heading',
      'code': 'text-code font-code',
      'caption': 'text-caption font-body',
    };

    const colorStyles = {
      default: 'text-on-surface',
      secondary: 'text-on-surface-variant',
      error: 'text-error',
    };

    return (
      <Component
        ref={ref}
        className={`${sizeStyles[variant]} ${colorStyles[color]} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';
