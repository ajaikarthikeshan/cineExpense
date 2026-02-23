'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/store/auth.store';

// ─── Icons ────────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
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

// ─── User Avatar ──────────────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-black shrink-0"
      style={{ backgroundColor: 'var(--accent-gold)' }}
      aria-label={`User: ${name}`}
    >
      {initials}
    </div>
  );
}

// ─── AppLayout ────────────────────────────────────────────────────────────────

interface AppLayoutProps {
  title: string;
  notificationCount?: number;
  rightPanel?: React.ReactNode;
  children: React.ReactNode;
}

const SIDEBAR_WIDTH = 240;
const RIGHT_PANEL_WIDTH = 380;
const HEADER_HEIGHT = 56;

export function AppLayout({
  title,
  notificationCount = 0,
  rightPanel,
  children,
}: AppLayoutProps) {
  const { user } = useAuthStore();
  const [mobileRightOpen, setMobileRightOpen] = useState(false);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* ── Sidebar ── */}
      <Sidebar notificationCount={notificationCount} />

      {/* ── Main area (offset from sidebar) ── */}
      <div
        className="flex flex-col min-h-screen"
        style={{ marginLeft: SIDEBAR_WIDTH }}
      >
        {/* ── Top Header ── */}
        <header
          className="flex items-center justify-between px-8 shrink-0 z-30 sticky top-0"
          style={{
            height: HEADER_HEIGHT,
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Page title */}
          <h1
            className="text-xl font-bold text-[var(--text-primary)] truncate"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {title}
          </h1>

          {/* Right controls */}
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button
              className={[
                'relative text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                'transition-colors duration-150 p-1 rounded',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]',
              ].join(' ')}
              aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
            >
              <BellIcon />
              {notificationCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-black"
                  style={{ backgroundColor: 'var(--accent-gold)' }}
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>

            {/* User avatar */}
            {user && <UserAvatar name={user.name} />}

            {/* Mobile right-panel toggle (only if rightPanel provided) */}
            {rightPanel && (
              <button
                onClick={() => setMobileRightOpen(true)}
                className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Open details panel"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="21" y1="10" x2="3" y2="10" />
                  <line x1="21" y1="6" x2="3" y2="6" />
                  <line x1="21" y1="14" x2="3" y2="14" />
                  <line x1="21" y1="18" x2="3" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </header>

        {/* ── Content row ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Page content ── */}
          <main
            className="flex-1 overflow-y-auto p-8"
            style={{
              minWidth: 0,
              // When right panel is present on desktop, leave room for it
            }}
          >
            {children}
          </main>

          {/* ── Right panel — desktop (sticky, inline) ── */}
          {rightPanel && (
            <>
              {/* Desktop inline panel */}
              <aside
                className="hidden lg:flex flex-col overflow-y-auto shrink-0"
                style={{
                  width: RIGHT_PANEL_WIDTH,
                  backgroundColor: 'var(--bg-surface)',
                  borderLeft: '1px solid var(--gold-border)',
                  height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                  position: 'sticky',
                  top: HEADER_HEIGHT,
                  alignSelf: 'flex-start',
                }}
              >
                {rightPanel}
              </aside>

              {/* Mobile overlay drawer */}
              {mobileRightOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
                  {/* Backdrop */}
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setMobileRightOpen(false)}
                  />
                  {/* Drawer */}
                  <aside
                    className="relative flex flex-col overflow-y-auto"
                    style={{
                      width: Math.min(RIGHT_PANEL_WIDTH, 320),
                      backgroundColor: 'var(--bg-surface)',
                      borderLeft: '1px solid var(--gold-border)',
                    }}
                  >
                    {/* Drawer close button */}
                    <div className="flex justify-end p-3 border-b border-[var(--border)]">
                      <button
                        onClick={() => setMobileRightOpen(false)}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded"
                        aria-label="Close panel"
                      >
                        <XIcon />
                      </button>
                    </div>
                    {rightPanel}
                  </aside>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
