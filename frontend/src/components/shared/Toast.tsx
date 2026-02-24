'use client';

import React, { useEffect } from 'react';
import type { ToastType } from '@/hooks/useToast';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const borderColorMap: Record<ToastType, string> = {
  success: 'var(--success)',
  warning: 'var(--accent-gold)',
  error: 'var(--accent-red)',
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      <div
        role="alert"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '14px 16px',
          borderRadius: '6px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderLeft: `3px solid ${borderColorMap[type]}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation: 'toastSlideIn 0.25s ease-out',
          maxWidth: '360px',
          minWidth: '240px',
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: '14px',
            lineHeight: '1.5',
            color: 'var(--text-primary)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {message}
        </span>

        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-muted)',
            flexShrink: 0,
            marginTop: '1px',
          }}
        >
          <XIcon />
        </button>
      </div>
    </>
  );
}
