'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function NotificationsPage() {
  return (
    <AppLayout title="Notifications">
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
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '20px',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          No notifications
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>
          You&apos;re all caught up.
        </p>
      </div>
    </AppLayout>
  );
}
