'use client';

import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = 'lg', padding = 'md', className = '', children, ...props }, ref) => {
    const sizeStyles = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      full: 'w-full',
    };

    const paddingStyles = {
      none: 'px-0 py-0',
      sm: 'px-3 py-3',
      md: 'px-6 py-6',
      lg: 'px-8 py-8',
    };

    return (
      <div
        ref={ref}
        className={`mx-auto ${sizeStyles[size]} ${paddingStyles[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';
