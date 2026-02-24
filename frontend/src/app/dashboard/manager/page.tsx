'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, type TableColumn } from '@/components/ui/Table';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/shared/Toast';
import { ManagerActionPanel } from '@/components/shared/ManagerActionPanel';
import { expensesApi } from '@/lib/api/expenses';
import type { Expense, BudgetSummary } from '@/types';

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

// ─── Icons ────────────────────────────────────────────────────────────────────

function BudgetWarnIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

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

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

type Tab = 'pending' | 'actioned';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'actioned', label: 'Actioned' },
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
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ManagerDashboardPage() {
  const { user } = useAuthStore();
  const { toast, showToast, hideToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [budgetSummaries, setBudgetSummaries] = useState<BudgetSummary[]>([]);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const {
    expenses: pendingExpenses,
    loading: pendingLoading,
    error: pendingError,
    refetch: refetchPending,
  } = useExpenses({ status: 'Submitted' });

  const {
    expenses: actionedExpenses,
    loading: actionedLoading,
    error: actionedError,
    refetch: refetchActioned,
  } = useExpenses({ status: 'ManagerApproved,ManagerReturned,ManagerRejected' });

  // Fetch budget summaries on mount — non-critical, fail silently
  useEffect(() => {
    expensesApi
      .getBudgetSummary()
      .then((res) => setBudgetSummaries(res.data))
      .catch(() => {});
  }, []);

  // ── Department filter ──────────────────────────────────────────────────────

  const myDeptIds = useMemo(
    () => new Set(user?.departments?.map((d) => d.id) ?? []),
    [user]
  );

  const myPendingExpenses = useMemo(
    () => pendingExpenses.filter((e) => myDeptIds.has(e.departmentId)),
    [pendingExpenses, myDeptIds]
  );

  const myActionedExpenses = useMemo(
    () => actionedExpenses.filter((e) => myDeptIds.has(e.departmentId)),
    [actionedExpenses, myDeptIds]
  );

  // ── Stats ──────────────────────────────────────────────────────────────────

  const today = useMemo(() => new Date().toDateString(), []);

  const stats = useMemo(() => {
    const approvedToday = myActionedExpenses.filter((e) =>
      e.statusHistory?.some(
        (h) =>
          h.performedBy === user?.id &&
          h.toStatus === 'ManagerApproved' &&
          new Date(h.performedAt).toDateString() === today
      )
    ).length;

    const returnedToday = myActionedExpenses.filter((e) =>
      e.statusHistory?.some(
        (h) =>
          h.performedBy === user?.id &&
          h.toStatus === 'ManagerReturned' &&
          new Date(h.performedAt).toDateString() === today
      )
    ).length;

    return {
      pending: myPendingExpenses.length,
      approvedToday,
      returnedToday,
    };
  }, [myPendingExpenses, myActionedExpenses, user, today]);

  // ── Synced selection (stale-reference guard after refetch) ─────────────────

  const syncedSelected = useMemo<Expense | null>(() => {
    if (!selectedExpense) return null;
    return (
      myPendingExpenses.find((e) => e.id === selectedExpense.id) ?? null
    );
  }, [selectedExpense, myPendingExpenses]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAction = useCallback(() => {
    refetchPending();
    refetchActioned();
    setSelectedExpense(null);
  }, [refetchPending, refetchActioned]);

  const handleRowClick = useCallback(
    (row: Record<string, unknown>) => {
      if (activeTab === 'pending') {
        setSelectedExpense(row as unknown as Expense);
      }
    },
    [activeTab]
  );

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setSelectedExpense(null);
  }, []);

  // ── Budget warning helper ──────────────────────────────────────────────────

  const isNearBudgetLimit = useCallback(
    (expense: Expense): boolean => {
      const summary = budgetSummaries.find(
        (b) => b.departmentId === expense.departmentId
      );
      if (!summary || summary.allocatedBudget === 0) return false;
      return (
        (summary.approvedSum + expense.amount) / summary.allocatedBudget >= 0.8
      );
    },
    [budgetSummaries]
  );

  // ── "Actioned On" helper ───────────────────────────────────────────────────

  const getActionedOn = useCallback(
    (expense: Expense): string => {
      if (!user) return '—';
      const myEntries = (expense.statusHistory ?? [])
        .filter((h) => h.performedBy === user.id)
        .sort(
          (a, b) =>
            new Date(b.performedAt).getTime() -
            new Date(a.performedAt).getTime()
        );
      return myEntries.length > 0
        ? formatDate(myEntries[0].performedAt)
        : '—';
    },
    [user]
  );

  // ── Table columns — Pending ────────────────────────────────────────────────

  const pendingColumns: TableColumn[] = useMemo(
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
          const expense = row as unknown as Expense;
          return (
            <span style={{ fontFamily: 'Inter, sans-serif' }}>
              {expense.submittedByUser?.name ?? '—'}
            </span>
          );
        },
      },
      {
        key: 'department',
        label: 'Department',
        render: (_, row) => {
          const expense = row as unknown as Expense;
          return (
            <span style={{ fontFamily: 'Inter, sans-serif' }}>
              {expense.department?.name ?? '—'}
            </span>
          );
        },
      },
      {
        key: 'description',
        label: 'Description',
        render: (val) => {
          const str = val as string;
          return (
            <span
              style={{
                color: 'var(--text-muted)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {str.length > 35 ? `${str.slice(0, 35)}…` : str}
            </span>
          );
        },
      },
      {
        key: 'amount',
        label: 'Amount',
        width: '150px',
        render: (_, row) => {
          const expense = row as unknown as Expense;
          const warn = isNearBudgetLimit(expense);
          return (
            <span className="flex items-center gap-1.5">
              <span
                className="font-medium"
                style={{
                  color: 'var(--accent-gold)',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '15px',
                }}
              >
                {formatAmount(expense.amount, expense.currency)}
              </span>
              {warn && (
                <span
                  title="Near budget limit"
                  style={{
                    color: 'var(--accent-gold)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <BudgetWarnIcon />
                </span>
              )}
            </span>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        width: '130px',
        render: (val) => <Badge status={val as Expense['status']} />,
      },
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
    [isNearBudgetLimit]
  );

  // ── Table columns — Actioned ───────────────────────────────────────────────

  const actionedColumns: TableColumn[] = useMemo(
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
          const expense = row as unknown as Expense;
          return (
            <span style={{ fontFamily: 'Inter, sans-serif' }}>
              {expense.submittedByUser?.name ?? '—'}
            </span>
          );
        },
      },
      {
        key: 'department',
        label: 'Department',
        render: (_, row) => {
          const expense = row as unknown as Expense;
          return (
            <span style={{ fontFamily: 'Inter, sans-serif' }}>
              {expense.department?.name ?? '—'}
            </span>
          );
        },
      },
      {
        key: 'amount',
        label: 'Amount',
        width: '130px',
        render: (_, row) => {
          const expense = row as unknown as Expense;
          return (
            <span
              className="font-medium"
              style={{
                color: 'var(--accent-gold)',
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '15px',
              }}
            >
              {formatAmount(expense.amount, expense.currency)}
            </span>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        width: '150px',
        render: (val) => <Badge status={val as Expense['status']} />,
      },
      {
        key: 'id',
        label: 'Actioned On',
        width: '130px',
        render: (_, row) => {
          const expense = row as unknown as Expense;
          return (
            <span
              style={{
                color: 'var(--text-muted)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {getActionedOn(expense)}
            </span>
          );
        },
      },
    ],
    [getActionedOn]
  );

  // ── Derived view state ────────────────────────────────────────────────────

  const displayExpenses =
    activeTab === 'pending' ? myPendingExpenses : myActionedExpenses;
  const displayColumns =
    activeTab === 'pending' ? pendingColumns : actionedColumns;
  const displayLoading =
    activeTab === 'pending' ? pendingLoading : actionedLoading;
  const displayError =
    activeTab === 'pending' ? pendingError : actionedError;

  // ── Right panel ───────────────────────────────────────────────────────────

  const rightPanel =
    syncedSelected && activeTab === 'pending' ? (
      <ManagerActionPanel
        key={syncedSelected.id}
        expense={syncedSelected}
        budgetSummaries={budgetSummaries}
        onAction={handleAction}
        onShowToast={showToast}
      />
    ) : undefined;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Pending Approvals" rightPanel={rightPanel}>
      <div className="flex flex-col gap-6">

        {/* ── Error banner ── */}
        {displayError && <ErrorBanner message={displayError} />}

        {/* ── Stats row (3 cards) ── */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Pending Review" value={stats.pending} />
          <StatCard label="Approved Today" value={stats.approvedToday} />
          <StatCard label="Returned Today" value={stats.returnedToday} />
        </div>

        {/* ── Tab bar ── */}
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* ── Expense table ── */}
        <Table
          columns={displayColumns}
          data={displayExpenses as unknown as Record<string, unknown>[]}
          onRowClick={activeTab === 'pending' ? handleRowClick : undefined}
          selectedId={
            activeTab === 'pending' ? syncedSelected?.id : undefined
          }
          loading={displayLoading}
          emptyMessage={
            activeTab === 'pending'
              ? 'No pending expenses to review.'
              : 'No actioned expenses yet.'
          }
        />
      </div>

      {/* ── Toast notification ── */}
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
