'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
  as?: React.ElementType;
}

const SIZES: Record<string, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-3 text-sm',
  lg: 'px-6 py-4 text-base',
};

const VARIANT_MAP: Record<string, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  destructive: 'btn-danger',
  ghost: 'btn-ghost',
  underline: 'btn-underline',
  'underline-active': 'btn-underline-active',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, isLoading, as: Component = 'button', children, className = '', ...props }, ref) => {
    const variantStyles = VARIANT_MAP[variant] || VARIANT_MAP['primary'];
    const sizeStyles = SIZES[size] || SIZES['md'];

    return (
      <Component
        ref={ref}
        className={`${variantStyles} ${sizeStyles} ${isLoading ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {icon && <span className="flex items-center">{icon}</span>}
        {children}
      </Component>
    );
  }
);

Button.displayName = 'Button';
