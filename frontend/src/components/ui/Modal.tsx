'use client';

import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function XIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.70)' }}
      onClick={onClose}
    >
      {/* Blur layer */}
      <div className="absolute inset-0 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        className={[
          'relative z-10 w-full max-w-[560px] rounded-lg',
          'bg-[var(--bg-surface)] border border-[var(--gold-border)]',
          'flex flex-col max-h-[90vh]',
          'shadow-[0_25px_60px_rgba(0,0,0,0.7)]',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <h2
            id="modal-title"
            className="text-xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className={[
              'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              'rounded p-1 transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]',
            ].join(' ')}
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer (optional) */}
        {footer && (
          <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
