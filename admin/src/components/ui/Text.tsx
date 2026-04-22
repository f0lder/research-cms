'use client';

import React from 'react';

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'body-lg' | 'body-md' | 'label' | 'code' | 'caption';
  color?: 'default' | 'secondary' | 'error';
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ variant = 'body-md', color = 'default', className = '', children, ...props }, ref) => {
    const sizeStyles = {
      'body-lg': 'text-body-lg font-body',
      'body-md': 'text-body-md font-body',
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
      <p
        ref={ref}
        className={`${sizeStyles[variant]} ${colorStyles[color]} ${className}`}
        {...props}
      >
        {children}
      </p>
    );
  }
);

Text.displayName = 'Text';
