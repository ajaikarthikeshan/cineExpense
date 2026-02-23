'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Table, type TableColumn } from '@/components/ui/Table';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuthStore } from '@/store/auth.store';
import {
  ExpenseDetailPanel,
  type ExpenseWithWarning,
} from '@/components/shared/ExpenseDetailPanel';
import { CreateExpenseModal } from '@/components/shared/CreateExpenseModal';
import { EditExpenseModal } from '@/components/shared/EditExpenseModal';
import type { Expense } from '@/types';

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupervisorDashboardPage() {
  const { user } = useAuthStore();
  const { expenses, loading, error, refetch } = useExpenses();

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);

  // Client-side filter: only the current user's expenses
  const myExpenses = useMemo(
    () => (user ? expenses.filter((e) => e.submittedBy === user.id) : []),
    [expenses, user]
  );

  // Keep selected expense in sync after refetch (stale reference guard)
  const syncedSelected = useMemo<ExpenseWithWarning | null>(
    () =>
      selectedExpense
        ? (myExpenses.find((e) => e.id === selectedExpense.id) ?? null)
        : null,
    [myExpenses, selectedExpense]
  );

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(
    () => ({
      total: myExpenses.length,
      pending: myExpenses.filter(
        (e) => e.status === 'Submitted' || e.status === 'ManagerApproved'
      ).length,
      approved: myExpenses.filter(
        (e) => e.status === 'AccountsApproved' || e.status === 'Paid'
      ).length,
      rejected: myExpenses.filter((e) => e.status === 'ManagerRejected').length,
    }),
    [myExpenses]
  );

  // ── Table columns ──────────────────────────────────────────────────────────

  const columns: TableColumn[] = [
    {
      key: 'expenseDate',
      label: 'Date',
      width: '120px',
      render: (val) => (
        <span style={{ fontFamily: 'Inter, sans-serif' }}>
          {formatDate(val as string)}
        </span>
      ),
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
        const truncated = str.length > 40 ? `${str.slice(0, 40)}…` : str;
        return (
          <span
            style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
          >
            {truncated}
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
      label: 'Action',
      width: '80px',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedExpense(row as unknown as Expense);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRowClick = (row: Record<string, unknown>) => {
    setSelectedExpense(row as unknown as Expense);
  };

  const handleEditOpen = (expense: Expense) => {
    setEditTarget(expense);
    setShowEditModal(true);
  };

  // ── Right panel ────────────────────────────────────────────────────────────

  const rightPanel = syncedSelected ? (
    <ExpenseDetailPanel
      expense={syncedSelected}
      onRefresh={refetch}
      onEdit={handleEditOpen}
    />
  ) : undefined;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="My Expenses" rightPanel={rightPanel}>
      <div className="flex flex-col gap-6">

        {/* ── Global Error ── */}
        {error && (
          <div
            className="px-4 py-3 rounded text-sm"
            style={{
              backgroundColor: 'rgba(153, 27, 27, 0.15)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {error}
          </div>
        )}

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Submitted" value={stats.total} />
          <StatCard label="Pending Approval" value={stats.pending} />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Rejected" value={stats.rejected} />
        </div>

        {/* ── Table Toolbar ── */}
        <div className="flex items-center justify-end">
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Submit New Expense
          </Button>
        </div>

        {/* ── Expenses Table ── */}
        <Table
          columns={columns}
          data={myExpenses as unknown as Record<string, unknown>[]}
          onRowClick={handleRowClick}
          selectedId={syncedSelected?.id}
          loading={loading}
          emptyMessage="No expenses yet. Submit your first expense to get started."
        />
      </div>

      {/* ── Modals ── */}
      <CreateExpenseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refetch();
        }}
      />

      {editTarget && (
        <EditExpenseModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditTarget(null);
          }}
          expense={editTarget}
          onSuccess={() => {
            setShowEditModal(false);
            setEditTarget(null);
            refetch();
          }}
        />
      )}
    </AppLayout>
  );
}
