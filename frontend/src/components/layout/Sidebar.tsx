'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/types';

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ─── Nav Config ───────────────────────────────────────────────────────────────

const dashboardHref: Record<UserRole, string> = {
  SUPERVISOR: '/dashboard/supervisor',
  MANAGER: '/dashboard/manager',
  ACCOUNTS: '/dashboard/accounts',
  PRODUCER: '/dashboard/producer',
  ADMIN: '/admin/users',
};

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
}

function buildNavItems(role: UserRole, notificationCount: number): NavItem[] {
  const items: NavItem[] = [
    {
      label: 'Dashboard',
      href: dashboardHref[role],
      icon: <GridIcon />,
      exact: true,
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: <BellIcon />,
    },
  ];

  switch (role) {
    case 'SUPERVISOR':
      items.push(
        { label: 'My Expenses', href: '/dashboard/supervisor', icon: <ReceiptIcon /> },
        { label: 'Submit Expense', href: '/expenses/new', icon: <PlusCircleIcon /> }
      );
      break;
    case 'MANAGER':
      items.push({ label: 'Pending Approvals', href: '/dashboard/manager', icon: <CheckCircleIcon /> });
      break;
    case 'ACCOUNTS':
      items.push(
        { label: 'Verification Queue', href: '/dashboard/accounts', icon: <ClipboardIcon /> },
        { label: 'Payments', href: '/dashboard/accounts?tab=payments', icon: <CreditCardIcon /> }
      );
      break;
    case 'PRODUCER':
      items.push({ label: 'Budget Overview', href: '/dashboard/producer', icon: <BarChartIcon /> });
      break;
    case 'ADMIN':
      items.push(
        { label: 'Users', href: '/admin/users', icon: <UsersIcon /> },
        { label: 'Departments', href: '/admin/departments', icon: <LayersIcon /> }
      );
      break;
  }

  return items;
}

const reportsRoles: UserRole[] = ['PRODUCER', 'ACCOUNTS', 'ADMIN'];

// ─── Nav Link ─────────────────────────────────────────────────────────────────

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  badge?: number;
}

function NavLink({ item, isActive, badge }: NavLinkProps) {
  return (
    <Link
      href={item.href}
      className={[
        'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 relative',
        'border-l-2',
        isActive
          ? 'border-l-[var(--accent-gold)] bg-[rgba(212,175,55,0.05)] text-[var(--text-primary)]'
          : 'border-l-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(212,175,55,0.03)]',
      ].join(' ')}
    >
      <span className="shrink-0">{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--accent-gold)] px-1.5 text-[10px] font-bold text-black">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  notificationCount?: number;
}

export function Sidebar({ notificationCount = 0 }: SidebarProps) {
  const { user, clearAuth } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    clearAuth();
    router.push('/auth/login');
  };

  if (!user) return null;

  const navItems = buildNavItems(user.role, notificationCount);
  const showReports = reportsRoles.includes(user.role);

  // Derive initials for role display
  const roleLabel = user.role.charAt(0) + user.role.slice(1).toLowerCase();

  // Active check — strip query string for comparison
  const isActive = (item: NavItem) => {
    const hrefPath = item.href.split('?')[0];
    if (item.exact) return pathname === hrefPath;
    return pathname === hrefPath || pathname.startsWith(hrefPath + '/');
  };

  return (
    <aside
      className="fixed top-0 left-0 h-full z-40 flex flex-col"
      style={{ width: 240, backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
    >
      {/* ── Logo ── */}
      <div className="px-5 pt-6 pb-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span
            className="text-2xl font-bold text-[var(--accent-gold)] leading-none tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            CineExpense
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'var(--accent-red)', color: 'white', letterSpacing: '0.05em' }}
          >
            PRO
          </span>
        </div>

        {/* User info */}
        <div className="mt-3">
          <p className="text-xs font-medium text-[var(--text-primary)] truncate">{user.name}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{roleLabel}</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive(item)}
            badge={item.label === 'Notifications' ? notificationCount : undefined}
          />
        ))}
      </nav>

      {/* ── Bottom section ── */}
      <div className="border-t border-[var(--border)] py-3">
        {showReports && (
          <NavLink
            item={{ label: 'Reports', href: '/reports', icon: <FileTextIcon /> }}
            isActive={pathname === '/reports'}
          />
        )}

        <button
          onClick={handleSignOut}
          className={[
            'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
            'border-l-2 border-l-transparent',
            'text-[var(--text-muted)] hover:text-[var(--accent-red)] hover:bg-[rgba(155,28,28,0.08)]',
            'transition-colors duration-150',
          ].join(' ')}
        >
          <LogOutIcon />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
