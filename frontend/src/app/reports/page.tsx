'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ReportsPage() {
  return (
    <AppLayout title="Reports">
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '20px',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Reports coming soon
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>
          Detailed budget and expense reports will appear here.
        </p>
      </div>
    </AppLayout>
  );
}
