'use client';

import React from 'react';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, helperText, icon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="font-label uppercase text-label text-on-surface">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-on-surface-variant pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full border-2 border-on-surface bg-surface px-4 py-2 font-code text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${icon ? 'pl-10' : ''} ${error ? 'border-error' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <span className="text-caption text-error font-bold uppercase">{error}</span>
        )}
        {helperText && !error && (
          <span className="text-caption text-on-surface-variant uppercase">{helperText}</span>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';
