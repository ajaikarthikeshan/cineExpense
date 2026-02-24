'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, type TableColumn } from '@/components/ui/Table';
import { useBudget } from '@/hooks/useBudget';
import { useExpenses } from '@/hooks/useExpenses';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/shared/Toast';
import { ProducerOverrideModal } from '@/components/shared/ProducerOverrideModal';
import type { Expense, BudgetSummary, ProductionStatus } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getProgressColor(pct: number): string {
  if (pct > 80) return 'var(--danger)';
  if (pct >= 60) return 'var(--warning)';
  return 'var(--success)';
}

function getProjectedPct(expense: Expense, summaries: BudgetSummary[]): number {
  const b = summaries.find((d) => d.departmentId === expense.departmentId);
  if (!b || b.allocatedBudget === 0) return 0;
  return ((b.approvedSum + expense.amount) / b.allocatedBudget) * 100;
}

// ─── Production status badge ──────────────────────────────────────────────────

function ProductionStatusBadge({ status }: { status: ProductionStatus }) {
  if (status === 'active') return <Badge variant="success">Active</Badge>;
  if (status === 'locked') return <Badge variant="warning">Locked</Badge>;
  return <Badge variant="neutral">Archived</Badge>;
}

// ─── Department status badge ──────────────────────────────────────────────────

function DeptStatusBadge({ pct }: { pct: number }) {
  if (pct > 80) return <Badge variant="danger">Critical</Badge>;
  if (pct >= 60) return <Badge variant="warning">Watch</Badge>;
  return <Badge variant="success">Healthy</Badge>;
}

// ─── Utilization progress bar ─────────────────────────────────────────────────

function UtilBar({
  pct,
  height = 6,
  pulse = false,
}: {
  pct: number;
  height?: number;
  pulse?: boolean;
}) {
  return (
    <div
      style={{
        height: `${height}px`,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: '9999px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${Math.min(pct, 100)}%`,
          backgroundColor: getProgressColor(pct),
          borderRadius: '9999px',
          transition: 'width 0.4s ease',
          ...(pulse ? { animation: 'budgetBarPulse 1.5s ease-in-out infinite' } : {}),
        }}
      />
    </div>
  );
}

// ─── Inline utilization bar for table column ──────────────────────────────────

function InlineUtilBar({ pct }: { pct: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          width: '120px',
          height: '6px',
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderRadius: '9999px',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(pct, 100)}%`,
            backgroundColor: getProgressColor(pct),
            borderRadius: '9999px',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          color: getProgressColor(pct),
          fontWeight: 600,
          minWidth: '42px',
        }}
      >
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        backgroundColor: 'rgba(153, 27, 27, 0.15)',
        border: '1px solid var(--danger)',
        borderRadius: '6px',
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif',
        color: 'var(--danger)',
      }}
    >
      {message}
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type Tab = 'budget' | 'overrides';

function TabBar({
  activeTab,
  onTabChange,
  overrideCount,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  overrideCount: number;
}) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'budget', label: 'Budget Overview' },
    {
      key: 'overrides',
      label: `Override Requests${overrideCount > 0 ? ` (${overrideCount})` : ''}`,
    },
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

// ─── View toggle ──────────────────────────────────────────────────────────────

function ViewToggle({
  view,
  onChange,
}: {
  view: 'table' | 'card';
  onChange: (v: 'table' | 'card') => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {(['table', 'card'] as const).map((v) => {
        const isActive = view === v;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            style={{
              padding: '5px 12px',
              background: 'none',
              border: `1px solid ${isActive ? 'var(--accent-gold)' : 'var(--border)'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
              transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            {v === 'table' ? 'Table View' : 'Card View'}
          </button>
        );
      })}
    </div>
  );
}

// ─── Refresh button ───────────────────────────────────────────────────────────

function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Refresh budget data"
      title="Refresh"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-muted)',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        transition: 'color 0.15s',
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-gold)')
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')
      }
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    </button>
  );
}

// ─── Card view skeleton ───────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
      }}
    >
      {[0, 1, 2].map((i) => (
        <Card key={i} padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                height: '18px',
                width: '60%',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
              className="animate-pulse"
            />
            <div
              style={{
                height: '12px',
                width: '40%',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}
              className="animate-pulse"
            />
            <div
              style={{
                height: '28px',
                width: '70%',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
              className="animate-pulse"
            />
            <div
              style={{
                height: '6px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
              className="animate-pulse"
            />
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Mini stat for card view ──────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  currency,
}: {
  label: string;
  value: number;
  currency: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
      <span
        style={{
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
          color: 'var(--text-primary)',
          fontWeight: 500,
        }}
      >
        {formatCurrency(value, currency)}
      </span>
    </div>
  );
}

// ─── Override empty state ─────────────────────────────────────────────────────

function OverrideEmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '64px 24px',
        color: 'var(--text-muted)',
      }}
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
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
      <h3
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '20px',
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        No override requests pending
      </h3>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          textAlign: 'center',
          maxWidth: '320px',
          margin: 0,
        }}
      >
        All departments are within budget limits.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProducerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('budget');
  const [deptView, setDeptView] = useState<'table' | 'card'>('table');
  const [overrideTarget, setOverrideTarget] = useState<Expense | null>(null);

  const { toast, showToast, hideToast } = useToast();

  // Budget data — auto-refreshes every 60 seconds
  const { summary, loading: budgetLoading, error: budgetError, refresh: refreshBudget } =
    useBudget();

  // Pending expenses: Submitted + ManagerApproved — used for Override Requests tab
  // and for Dept Pending column + Total Pending stat
  const {
    expenses: pendingExpenses,
    loading: pendingLoading,
    refetch: refetchPending,
  } = useExpenses({ status: 'Submitted,ManagerApproved' });

  // Paid expenses — used for Dept Paid column + Total Paid stat
  const { expenses: paidExpenses } = useExpenses({ status: 'Paid' });

  // ─── Pre-computed lookup maps (O(1) in render fns) ─────────────────────────

  const pendingSumByDept = useMemo(
    () =>
      pendingExpenses.reduce<Record<string, number>>((acc, e) => {
        acc[e.departmentId] = (acc[e.departmentId] ?? 0) + e.amount;
        return acc;
      }, {}),
    [pendingExpenses]
  );

  const paidSumByDept = useMemo(
    () =>
      paidExpenses.reduce<Record<string, number>>((acc, e) => {
        acc[e.departmentId] = (acc[e.departmentId] ?? 0) + e.amount;
        return acc;
      }, {}),
    [paidExpenses]
  );

  // ─── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const departments = summary?.departments ?? [];
    const totalBudget = departments.reduce((s, d) => s + d.allocatedBudget, 0);
    const totalApproved = departments.reduce((s, d) => s + d.approvedSum, 0);
    const totalPaid = paidExpenses.reduce((s, e) => s + e.amount, 0);
    const totalPending = pendingExpenses.reduce((s, e) => s + e.amount, 0);
    const overallUtilPct = totalBudget > 0 ? (totalApproved / totalBudget) * 100 : 0;
    return { totalBudget, totalApproved, totalPaid, totalPending, overallUtilPct };
  }, [summary, paidExpenses, pendingExpenses]);

  // ─── Sorted departments (highest risk first) ────────────────────────────────

  const sortedDepartments = useMemo(
    () =>
      [...(summary?.departments ?? [])].sort(
        (a, b) => b.utilizationPercent - a.utilizationPercent
      ),
    [summary]
  );

  // ─── Override requests (client-side filter) ─────────────────────────────────

  const overrideRequests = useMemo(() => {
    if (!summary) return [];
    return pendingExpenses.filter((e) => {
      const b = summary.departments.find((d) => d.departmentId === e.departmentId);
      return b && b.allocatedBudget > 0 && b.approvedSum + e.amount > b.allocatedBudget;
    });
  }, [pendingExpenses, summary]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setOverrideTarget(null);
  }, []);

  const handleOverrideSuccess = useCallback(() => {
    showToast('Budget override approved. Manager can now proceed.', 'success');
    setOverrideTarget(null);
    refetchPending();
    refreshBudget();
  }, [showToast, refetchPending, refreshBudget]);

  // ─── Department table columns ───────────────────────────────────────────────

  const currency = summary?.production.baseCurrency ?? 'CAD';

  const departmentTableColumns: TableColumn[] = useMemo(
    () => [
      {
        key: 'departmentName',
        label: 'Department',
        render: (val) => (
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '15px',
              color: 'var(--text-primary)',
            }}
          >
            {val as string}
          </span>
        ),
      },
      {
        key: 'allocatedBudget',
        label: 'Allocated',
        width: '140px',
        render: (val) => (
          <span
            style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text-muted)', fontSize: '13px' }}
          >
            {formatCurrency(val as number, currency)}
          </span>
        ),
      },
      {
        key: 'approvedSum',
        label: 'Approved',
        width: '140px',
        render: (val) => (
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '15px',
              color: 'var(--accent-gold)',
            }}
          >
            {formatCurrency(val as number, currency)}
          </span>
        ),
      },
      {
        key: '_pending',
        label: 'Pending',
        width: '130px',
        render: (_, row) => {
          const d = row as unknown as BudgetSummary;
          const amount = pendingSumByDept[d.departmentId] ?? 0;
          return (
            <span
              style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text-muted)', fontSize: '13px' }}
            >
              {formatCurrency(amount, currency)}
            </span>
          );
        },
      },
      {
        key: '_paid',
        label: 'Paid',
        width: '130px',
        render: (_, row) => {
          const d = row as unknown as BudgetSummary;
          const amount = paidSumByDept[d.departmentId] ?? 0;
          return (
            <span
              style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text-muted)', fontSize: '13px' }}
            >
              {formatCurrency(amount, currency)}
            </span>
          );
        },
      },
      {
        key: '_utilBar',
        label: 'Utilization',
        width: '220px',
        render: (_, row) => {
          const d = row as unknown as BudgetSummary;
          return <InlineUtilBar pct={d.utilizationPercent} />;
        },
      },
      {
        key: '_status',
        label: 'Status',
        width: '100px',
        render: (_, row) => {
          const d = row as unknown as BudgetSummary;
          return <DeptStatusBadge pct={d.utilizationPercent} />;
        },
      },
    ],
    [currency, pendingSumByDept, paidSumByDept]
  );

  // ─── Override requests table columns ────────────────────────────────────────

  const overrideColumns: TableColumn[] = useMemo(
    () => [
      {
        key: 'expenseDate',
        label: 'Date',
        width: '110px',
        render: (val) => (
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-muted)' }}>
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
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-primary)' }}>
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
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-primary)' }}>
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
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '16px',
                color: 'var(--accent-gold)',
              }}
            >
              {formatCurrency(e.amount, e.currency)}
            </span>
          );
        },
      },
      {
        key: '_wouldPushTo',
        label: 'Would Push To',
        width: '140px',
        render: (_, row) => {
          const e = row as unknown as Expense;
          const pct = getProjectedPct(e, summary?.departments ?? []);
          const color =
            pct > 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--text-muted)';
          return (
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                color,
              }}
            >
              {pct.toFixed(1)}%
            </span>
          );
        },
      },
      {
        key: 'id',
        label: 'Action',
        width: '160px',
        render: (_, row) => {
          const e = row as unknown as Expense;
          return (
            <Button
              variant="primary"
              size="sm"
              onClick={(ev) => {
                ev.stopPropagation();
                setOverrideTarget(e);
              }}
            >
              Review Override
            </Button>
          );
        },
      },
    ],
    [summary]
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  const isPulsing = stats.overallUtilPct > 80;

  return (
    <AppLayout title="Production Budget Overview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Pulse keyframe — injected only when critical utilization */}
        {isPulsing && (
          <style>{`
            @keyframes budgetBarPulse {
              0%,100% { opacity: 1; }
              50%      { opacity: 0.5; }
            }
          `}</style>
        )}

        {/* Tab bar */}
        <TabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          overrideCount={overrideRequests.length}
        />

        {/* ── Budget Overview Tab ─────────────────────────────────────────── */}
        {activeTab === 'budget' && (
          <>
            {/* Production summary header */}
            <Card goldAccent padding="lg">
              {budgetLoading || !summary ? (
                /* Header skeleton */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div
                        style={{ height: '28px', width: '220px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)' }}
                        className="animate-pulse"
                      />
                      <div
                        style={{ height: '20px', width: '80px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.04)' }}
                        className="animate-pulse"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '32px' }}>
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ height: '32px', width: '110px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)' }} className="animate-pulse" />
                          <div style={{ height: '12px', width: '80px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.04)' }} className="animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ height: '8px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.06)' }} className="animate-pulse" />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Row 1: name + stats */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    {/* Left: production name + status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h2
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: '28px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          margin: 0,
                          lineHeight: 1.2,
                        }}
                      >
                        {summary.production.name}
                      </h2>
                      <ProductionStatusBadge status={summary.production.status} />
                    </div>

                    {/* Right: 4 stat blocks */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '32px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {[
                        { label: 'Total Budget', value: stats.totalBudget },
                        { label: 'Total Approved', value: stats.totalApproved },
                        { label: 'Total Paid', value: stats.totalPaid },
                        { label: 'Total Pending', value: stats.totalPending },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span
                            style={{
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: '26px',
                              fontWeight: 600,
                              color: 'var(--accent-gold)',
                              lineHeight: 1,
                            }}
                          >
                            {formatCurrency(value, currency)}
                          </span>
                          <span
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '12px',
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Row 2: overall utilization bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Overall Budget Utilization — {stats.overallUtilPct.toFixed(1)}%
                      </span>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {formatCurrency(stats.totalApproved, currency)} of{' '}
                        {formatCurrency(stats.totalBudget, currency)} total budget committed
                      </span>
                    </div>
                    <UtilBar pct={stats.overallUtilPct} height={8} pulse={isPulsing} />
                  </div>
                </div>
              )}
            </Card>

            {/* Department breakdown section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Section header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '22px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  Department Breakdown
                </h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <RefreshButton onClick={refreshBudget} />
                  <ViewToggle view={deptView} onChange={setDeptView} />
                </div>
              </div>

              {/* Error state */}
              {budgetError && <ErrorBanner message={budgetError} />}

              {/* Table view */}
              {deptView === 'table' && (
                <Table
                  columns={departmentTableColumns}
                  data={sortedDepartments as unknown as Record<string, unknown>[]}
                  loading={budgetLoading}
                  emptyMessage="No department budget data available."
                />
              )}

              {/* Card view */}
              {deptView === 'card' && (
                <>
                  {budgetLoading ? (
                    <CardSkeleton />
                  ) : sortedDepartments.length === 0 ? (
                    <div
                      style={{
                        padding: '32px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                      }}
                    >
                      No department budget data available.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '16px',
                      }}
                    >
                      {sortedDepartments.map((dept) => {
                        const pendingSum = pendingSumByDept[dept.departmentId] ?? 0;
                        const paidSum = paidSumByDept[dept.departmentId] ?? 0;
                        const remaining = dept.allocatedBudget - dept.approvedSum;

                        return (
                          <Card
                            key={dept.departmentId}
                            goldAccent={dept.utilizationPercent > 80}
                            padding="md"
                          >
                            <div
                              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                            >
                              {/* Department name */}
                              <h3
                                style={{
                                  fontFamily: "'Cormorant Garamond', serif",
                                  fontSize: '18px',
                                  fontWeight: 600,
                                  color: 'var(--text-primary)',
                                  margin: 0,
                                }}
                              >
                                {dept.departmentName}
                              </h3>

                              {/* Allocated budget */}
                              <span
                                style={{
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '12px',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {formatCurrency(dept.allocatedBudget, currency)} allocated
                              </span>

                              {/* Large approved amount */}
                              <span
                                style={{
                                  fontFamily: "'Cormorant Garamond', serif",
                                  fontSize: '28px',
                                  fontWeight: 600,
                                  color: 'var(--accent-gold)',
                                  lineHeight: 1,
                                }}
                              >
                                {formatCurrency(dept.approvedSum, currency)}
                              </span>

                              {/* Progress bar */}
                              <UtilBar pct={dept.utilizationPercent} height={6} />

                              {/* Utilization percentage */}
                              <span
                                style={{
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '12px',
                                  color: getProgressColor(dept.utilizationPercent),
                                  fontWeight: 600,
                                }}
                              >
                                {dept.utilizationPercent.toFixed(1)}% utilised
                              </span>

                              {/* Three mini-stats */}
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '8px',
                                  paddingTop: '8px',
                                  borderTop: '1px solid var(--border)',
                                }}
                              >
                                <MiniStat label="Pending" value={pendingSum} currency={currency} />
                                <MiniStat label="Paid" value={paidSum} currency={currency} />
                                <MiniStat
                                  label="Remaining"
                                  value={Math.max(remaining, 0)}
                                  currency={currency}
                                />
                              </div>

                              {/* Status badge */}
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <DeptStatusBadge pct={dept.utilizationPercent} />
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ── Override Requests Tab ───────────────────────────────────────── */}
        {activeTab === 'overrides' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingLoading ? (
              <Table
                columns={overrideColumns}
                data={[]}
                loading
              />
            ) : overrideRequests.length === 0 ? (
              <OverrideEmptyState />
            ) : (
              <Table
                columns={overrideColumns}
                data={overrideRequests as unknown as Record<string, unknown>[]}
                loading={false}
                emptyMessage="No override requests pending."
              />
            )}
          </div>
        )}
      </div>

      {/* Override modal */}
      {overrideTarget && (
        <ProducerOverrideModal
          expense={overrideTarget}
          budgetSummaries={summary?.departments ?? []}
          onSuccess={handleOverrideSuccess}
          onClose={() => setOverrideTarget(null)}
        />
      )}

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
