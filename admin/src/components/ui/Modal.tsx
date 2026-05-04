'use client';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
}

export function Modal({ isOpen, title, onClose, children, size = 'md', footer }: ModalProps) {
  if (!isOpen) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[size];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className={`${sizeClass} w-full bg-white border-2 border-on-surface shadow-lg`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-on-surface p-4">
            <h2 className="text-lg font-bold uppercase text-on-surface">{title}</h2>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface text-xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t-2 border-on-surface p-4 flex gap-2 justify-end">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
