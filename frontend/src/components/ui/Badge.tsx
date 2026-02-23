import React from 'react';
import type { ExpenseStatus } from '@/types';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral';

// Discriminated union: either a status badge or a generic variant badge
type BadgeProps =
  | {
      status: ExpenseStatus;
      variant?: never;
      children?: never;
      className?: string;
    }
  | {
      variant: BadgeVariant;
      children: React.ReactNode;
      status?: never;
      className?: string;
    };

const statusConfig: Record<
  ExpenseStatus,
  { label: string; className: string }
> = {
  Draft: {
    label: 'Draft',
    className:
      'bg-[rgba(163,163,163,0.15)] text-[var(--text-muted)] border border-[rgba(163,163,163,0.2)]',
  },
  Submitted: {
    label: 'Submitted',
    className:
      'bg-[rgba(29,78,216,0.20)] text-[#93C5FD] border border-[rgba(29,78,216,0.3)]',
  },
  ManagerReturned: {
    label: 'Returned',
    className:
      'bg-[rgba(180,83,9,0.20)] text-[var(--warning)] border border-[rgba(180,83,9,0.3)]',
  },
  ManagerRejected: {
    label: 'Rejected',
    className:
      'bg-[rgba(153,27,27,0.20)] text-[var(--danger)] border border-[rgba(153,27,27,0.3)]',
  },
  ManagerApproved: {
    label: 'Mgr Approved',
    className:
      'bg-[rgba(21,128,61,0.20)] text-[var(--success)] border border-[rgba(21,128,61,0.3)]',
  },
  AccountsReturned: {
    label: 'Accts Returned',
    className:
      'bg-[rgba(180,83,9,0.20)] text-[var(--warning)] border border-[rgba(180,83,9,0.3)]',
  },
  AccountsApproved: {
    label: 'Accts Approved',
    className:
      'bg-[var(--success)] text-white border border-[var(--success)]',
  },
  Paid: {
    label: 'Paid',
    className:
      'bg-[rgba(212,175,55,0.20)] text-[var(--accent-gold)] border border-[rgba(212,175,55,0.3)]',
  },
};

const variantConfig: Record<BadgeVariant, string> = {
  success:
    'bg-[rgba(21,128,61,0.20)] text-[var(--success)] border border-[rgba(21,128,61,0.3)]',
  warning:
    'bg-[rgba(180,83,9,0.20)] text-[var(--warning)] border border-[rgba(180,83,9,0.3)]',
  danger:
    'bg-[rgba(153,27,27,0.20)] text-[var(--danger)] border border-[rgba(153,27,27,0.3)]',
  neutral:
    'bg-[rgba(163,163,163,0.15)] text-[var(--text-muted)] border border-[rgba(163,163,163,0.2)]',
};

const baseClasses =
  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-[Inter] whitespace-nowrap';

export function Badge({ status, variant, children, className = '' }: BadgeProps) {
  if (status !== undefined) {
    const config = statusConfig[status];
    return (
      <span className={[baseClasses, config.className, className].join(' ')}>
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={[baseClasses, variantConfig[variant as BadgeVariant], className].join(
        ' '
      )}
    >
      {children}
    </span>
  );
}
