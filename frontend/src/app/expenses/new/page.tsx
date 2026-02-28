'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function NewExpensePage() {
  return (
    <AppLayout title="Submit Expense">
      <div
        className="flex flex-col items-center justify-center gap-4 py-24"
        style={{ color: 'var(--text-muted)' }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.3 }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '20px',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          New Expense
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>
          Expense submission form coming soon.
        </p>
      </div>
    </AppLayout>
  );
}
