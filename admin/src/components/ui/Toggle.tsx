import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * iPhone-Style Toggle Switch Component (Square)
 * Features:
 * - Smooth sliding animation from left to right
 * - Square shape with hard edges
 * - Orange (#FF6B00) when active, gray when inactive
 * - Accessible with ARIA labels and keyboard support
 */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  ariaLabel,
  className = '',
}: ToggleProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <label className={`flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <div className="relative inline-block">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label={ariaLabel || label}
          className="sr-only"
        />
        {/* Background track */}
        <div
          className={`w-11 h-6 transition-colors duration-300 ${
            checked 
              ? 'bg-primary' 
              : 'bg-secondary-container'
          } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        />
        {/* Sliding square */}
        <div
          className={`absolute top-1 w-4 h-4 bg-surface transition-transform duration-300 ${
            checked 
              ? 'translate-x-5' 
              : 'translate-x-1'
          }`}
        />
      </div>
      {label && <span className="text-sm text-zinc-700 font-medium">{label}</span>}
    </label>
  );
}
