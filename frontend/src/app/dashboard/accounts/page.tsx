'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, type TableColumn } from '@/components/ui/Table';
import { useExpenses } from '@/hooks/useExpenses';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/shared/Toast';
import { AccountsActionPanel } from '@/components/shared/AccountsActionPanel';
import type { Expense, Payment } from '@/types';

// ─── Local type extension ─────────────────────────────────────────────────────

interface ExpenseWithPayment extends Expense {
  payment?: Payment;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`;
}

// ─── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card goldAccent padding="md">
      <div className="flex flex-col gap-1">
        <span
          className="text-4xl font-bold leading-none"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: 'var(--text-primary)',
          }}
        >
          {value}
        </span>
        <span
          className="text-xs mt-2"
          style={{
            color: 'var(--text-muted)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {label}
        </span>
      </div>
    </Card>
  );
}

// ─── TabBar ────────────────────────────────────────────────────────────────────

type Tab = 'verification' | 'payment' | 'completed';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  counts: Record<Tab, number>;
}

function TabBar({ activeTab, onTabChange, counts }: TabBarProps) {
  const tabs: { key: Tab; label: string }[] = [
    {
      key: 'verification',
      label: `Verification Queue${counts.verification > 0 ? ` (${counts.verification})` : ''}`,
    },
    {
      key: 'payment',
      label: `Payment Queue${counts.payment > 0 ? ` (${counts.payment})` : ''}`,
    },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div style={{ borderBottom: '1px solid var(--border)', display: 'flex' }}>
      {tabs.map(({ key, label }) => {
        const isActive = key === activeTab;
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: isActive
                ? '2px solid var(--accent-gold)'
                : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'color 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Error Banner ──────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="px-4 py-3 rounded text-sm"
      style={{
        backgroundColor: 'rgba(153, 27, 27, 0.15)',
        border: '1px solid var(--danger)',
        color: 'var(--danger)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {message}
    </div>
  );
}

// ─── Receipt Thumbnail Cell ────────────────────────────────────────────────────

function ReceiptThumb({ expense }: { expense: Expense }) {
  const hasReceipt = expense.receipts?.length > 0;
  const first = expense.receipts?.[0];

  if (!hasReceipt) {
    return (
      <div
        style={{
          width: '36px',
          height: '36px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px dashed var(--border)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: 'var(--text-muted)',
          fontFamily: 'Inter, sans-serif',
          flexShrink: 0,
        }}
      >
        —
      </div>
    );
  }

  return (
    <a
      href={first.filePath}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title="View Receipt"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        backgroundColor: 'rgba(212,175,55,0.08)',
        border: '1px solid var(--gold-border)',
        borderRadius: '4px',
        flexShrink: 0,
        cursor: 'pointer',
        textDecoration: 'none',
        gap: '2px',
        transition: 'background-color 0.15s',
      }}
      className="hover:bg-[rgba(212,175,55,0.15)]"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent-gold)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span
        style={{
          fontSize: '8px',
          color: 'var(--accent-gold)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Receipt
      </span>
    </a>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AccountsDashboardPage() {
  const { toast, showToast, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('verification');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const {
    expenses: verificationExpenses,
    loading: verificationLoading,
    error: verificationError,
    refetch: refetchVerification,
  } = useExpenses({ status: 'ManagerApproved' });

  const {
    expenses: paymentExpenses,
    loading: paymentLoading,
    error: paymentError,
    refetch: refetchPayment,
  } = useExpenses({ status: 'AccountsApproved' });

  const {
    expenses: completedExpenses,
    loading: completedLoading,
    error: completedError,
    refetch: refetchCompleted,
  } = useExpenses({ status: 'Paid' });

  // ── Stats ──────────────────────────────────────────────────────────────────

  const today = useMemo(() => new Date().toDateString(), []);

  const stats = useMemo(() => {
    const approvedToday =
      // AccountsApproved today (still in payment queue)
      paymentExpenses.filter((e) =>
        e.statusHistory?.some(
          (h) =>
            h.toStatus === 'AccountsApproved' &&
            new Date(h.performedAt).toDateString() === today
        )
      ).length +
      // AccountsApproved today (already paid)
      completedExpenses.filter((e) =>
        e.statusHistory?.some(
          (h) =>
            h.toStatus === 'AccountsApproved' &&
            new Date(h.performedAt).toDateString() === today
        )
      ).length;

    const paidToday = completedExpenses.filter((e) =>
      e.statusHistory?.some(
        (h) =>
          h.toStatus === 'Paid' &&
          new Date(h.performedAt).toDateString() === today
      )
    ).length;

    return {
      pendingVerification: verificationExpenses.length,
      approvedToday,
      pendingPayment: paymentExpenses.length,
      paidToday,
    };
  }, [verificationExpenses, paymentExpenses, completedExpenses, today]);

  // ── Active expenses (for the current tab) ──────────────────────────────────

  const activeExpenses = useMemo(() => {
    if (activeTab === 'verification') return verificationExpenses;
    if (activeTab === 'payment') return paymentExpenses;
    return completedExpenses;
  }, [activeTab, verificationExpenses, paymentExpenses, completedExpenses]);

  // ── Synced selection (guard against stale reference after refetch) ──────────

  const syncedSelected = useMemo<Expense | null>(() => {
    if (!selectedExpense) return null;
    return activeExpenses.find((e) => e.id === selectedExpense.id) ?? null;
  }, [selectedExpense, activeExpenses]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAction = useCallback(() => {
    refetchVerification();
    refetchPayment();
    refetchCompleted();
    setSelectedExpense(null);
  }, [refetchVerification, refetchPayment, refetchCompleted]);

  const handleRowClick = useCallback((row: Record<string, unknown>) => {
    setSelectedExpense(row as unknown as Expense);
  }, []);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setSelectedExpense(null);
  }, []);

  // ── Table columns — base (used by verification and payment) ───────────────

  const baseColumns = useMemo<TableColumn[]>(
    () => [
      {
        key: 'expenseDate',
        label: 'Date',
        width: '110px',
        render: (val) => (
          <span style={{ fontFamily: 'Inter, sans-serif' }}>
            {formatDate(val as string)}
          </span>
        ),
      },
      {
        key: 'submittedByUser',
        label: 'Supervisor',
        render: (_, row) => {
          const e = row as unknown as Expense;
          return (
            <span style={{ fontFamily: 'Inter, sans-serif' }}>
              {e.submittedByUser?.name ?? '—'}
            </span>
          );
        },
      },
      {
        key: 'department',
        label: 'Department',
        render: (_, row) => {
          const e = row as unknown as Expense;
          return (
            <span style={{ fontFamily: 'Inter, sans-serif' }}>
              {e.department?.name ?? '—'}
            </span>
          );
        },
      },
      {
        key: 'amount',
        label: 'Amount',
        width: '130px',
        render: (_, row) => {
          const e = row as unknown as Expense;
          return (
            <span
              className="font-medium"
              style={{
                color: 'var(--accent-gold)',
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '15px',
              }}
            >
              {formatAmount(e.amount, e.currency)}
            </span>
          );
        },
      },
      {
        key: 'receipts',
        label: 'Bill Preview',
        width: '90px',
        render: (_, row) => (
          <ReceiptThumb expense={row as unknown as Expense} />
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: '130px',
        render: (val) => <Badge status={val as Expense['status']} />,
      },
    ],
    []
  );

  const verificationColumns = useMemo<TableColumn[]>(
    () => [
      ...baseColumns,
      {
        key: 'id',
        label: 'Action',
        width: '90px',
        render: (_, row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedExpense(row as unknown as Expense);
            }}
          >
            Review
          </Button>
        ),
      },
    ],
    [baseColumns]
  );

  const paymentColumns = useMemo<TableColumn[]>(
    () => [
      ...baseColumns,
      {
        key: 'id',
        label: 'Action',
        width: '100px',
        render: (_, row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedExpense(row as unknown as Expense);
            }}
          >
            Mark Paid
          </Button>
        ),
      },
    ],
    [baseColumns]
  );

  // Completed has different columns (no Bill Preview, adds Payment Method / Ref / Paid On)
  const completedColumns = useMemo<TableColumn[]>(
    () => [
      {
        key: 'expenseDate',
        label: 'Date',
        width: '110px',
        render: (val) => (
          <span style={{ fontFamily: 'Inter, sans-serif' }}>
            {formatDate(val as string)}
          </span>
        ),
      },
      {
        key: 'submittedByUser',
        label: 'Supervisor',
        render: (_, row) => {
          const e = row as unknown as Expense;
          return (
            <span style={{ fontFamily: 'Inter, sans-serif' }}>
              {e.submittedByUser?.name ?? '—'}
            </span>
          );
        },
      },
      {
        key: 'department',
        label: 'Department',
        render: (_, row) => {
          const e = row as unknown as Expense;
          return (
            <span style={{ fontFamily: 'Inter, sans-serif' }}>
              {e.department?.name ?? '—'}
            </span>
          );
        },
      },
      {
        key: 'amount',
        label: 'Amount',
        width: '120px',
        render: (_, row) => {
          const e = row as unknown as Expense;
          return (
            <span
              className="font-medium"
              style={{
                color: 'var(--accent-gold)',
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '15px',
              }}
            >
              {formatAmount(e.amount, e.currency)}
            </span>
          );
        },
      },
      {
        // Virtual key — row[key] is undefined; render accesses full row
        key: '_paymentMethod',
        label: 'Payment Method',
        width: '130px',
        render: (_, row) => {
          const e = row as unknown as ExpenseWithPayment;
          const pm = e.payment?.paymentMethod;
          if (!pm) {
            return (
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                —
              </span>
            );
          }
          return (
            <Badge variant={pm === 'cash' ? 'neutral' : 'success'}>
              {pm === 'cash' ? 'CASH' : 'BANK'}
            </Badge>
          );
        },
      },
      {
        key: '_referenceNumber',
        label: 'Ref No.',
        width: '130px',
        render: (_, row) => {
          const e = row as unknown as ExpenseWithPayment;
          return (
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                color: 'var(--text-muted)',
                fontSize: '12px',
              }}
            >
              {e.payment?.referenceNumber ?? '—'}
            </span>
          );
        },
      },
      {
        key: '_paidOn',
        label: 'Paid On',
        width: '110px',
        render: (_, row) => {
          const e = row as unknown as ExpenseWithPayment;
          const paidEntry = e.statusHistory?.find(
            (h) => h.toStatus === 'Paid'
          );
          const dateStr = e.payment?.paymentDate
            ? formatDate(e.payment.paymentDate)
            : paidEntry
            ? formatDate(paidEntry.performedAt)
            : '—';
          return (
            <span style={{ fontFamily: 'Inter, sans-serif' }}>{dateStr}</span>
          );
        },
      },
    ],
    []
  );

  // ── Derived view state ────────────────────────────────────────────────────

  const displayExpenses =
    activeTab === 'verification'
      ? verificationExpenses
      : activeTab === 'payment'
      ? paymentExpenses
      : completedExpenses;

  const displayColumns =
    activeTab === 'verification'
      ? verificationColumns
      : activeTab === 'payment'
      ? paymentColumns
      : completedColumns;

  const displayLoading =
    activeTab === 'verification'
      ? verificationLoading
      : activeTab === 'payment'
      ? paymentLoading
      : completedLoading;

  const displayError =
    activeTab === 'verification'
      ? verificationError
      : activeTab === 'payment'
      ? paymentError
      : completedError;

  // ── Right panel ────────────────────────────────────────────────────────────

  const rightPanel = syncedSelected ? (
    <AccountsActionPanel
      key={syncedSelected.id}
      expense={syncedSelected}
      onAction={handleAction}
      onShowToast={showToast}
    />
  ) : undefined;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Accounts — Payment Management" rightPanel={rightPanel}>
      <div className="flex flex-col gap-6">
        {/* Error banner */}
        {displayError && <ErrorBanner message={displayError} />}

        {/* Stats row — 4 cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Pending Verification"
            value={stats.pendingVerification}
          />
          <StatCard label="Approved Today" value={stats.approvedToday} />
          <StatCard label="Pending Payment" value={stats.pendingPayment} />
          <StatCard label="Paid Today" value={stats.paidToday} />
        </div>

        {/* Tab bar */}
        <TabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={{
            verification: verificationExpenses.length,
            payment: paymentExpenses.length,
            completed: completedExpenses.length,
          }}
        />

        {/* Expense table */}
        <Table
          columns={displayColumns}
          data={displayExpenses as unknown as Record<string, unknown>[]}
          onRowClick={handleRowClick}
          selectedId={syncedSelected?.id}
          loading={displayLoading}
          emptyMessage={
            activeTab === 'verification'
              ? 'No expenses pending verification.'
              : activeTab === 'payment'
              ? 'No expenses pending payment.'
              : 'No completed payments yet.'
          }
        />
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={hideToast}
        />
      )}
    </AppLayout>
  );
}
