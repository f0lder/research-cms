'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
  as?: React.ElementType;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, isLoading, children, className = '', ...props }, ref) => {
    const baseStyles = 'font-label uppercase tracking-widest transition-all font-bold flex items-center gap-2 justify-center border-2 border-on-surface';

    const variantStyles = {
      primary: 'bg-primary text-white hover:opacity-90 active:translate-x-1 active:translate-y-1 shadow-hard active:shadow-none',
      secondary: 'bg-surface border-on-surface text-on-surface hover:bg-surface-container active:translate-x-1 active:translate-y-1 shadow-hard-sm active:shadow-none',
      ghost: 'bg-transparent text-on-surface hover:bg-surface-container border-on-surface',
    };

    const sizeStyles = {
      sm: 'px-3 py-2 text-xs',
      md: 'px-4 py-3 text-sm',
      lg: 'px-6 py-4 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${isLoading ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {icon && <span className="flex items-center">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
