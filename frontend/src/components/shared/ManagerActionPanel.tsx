'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { expensesApi } from '@/lib/api/expenses';
import { EXPENSE_STATUS_LABELS } from '@/lib/constants/roles';
import type { Expense, BudgetSummary, ExpenseStatusHistory, ExpenseStatus } from '@/types';
import type { ToastType } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/utils/api-error';

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

function isImagePath(path: string): boolean {
  const lower = path.toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].some((ext) =>
    lower.includes(ext)
  );
}

// ─── Timeline helpers (mirrors ExpenseDetailPanel — do not redesign) ──────────

function getTimelineDotColor(toStatus: ExpenseStatus): string {
  if (
    toStatus === 'ManagerApproved' ||
    toStatus === 'AccountsApproved' ||
    toStatus === 'Paid'
  ) {
    return 'var(--accent-gold)';
  }
  if (toStatus === 'ManagerRejected') return 'var(--danger)';
  if (toStatus === 'ManagerReturned' || toStatus === 'AccountsReturned')
    return 'var(--warning)';
  if (toStatus === 'Submitted') return '#93C5FD';
  return 'var(--text-muted)';
}

function getTransitionLabel(entry: ExpenseStatusHistory): string {
  const toLabel = EXPENSE_STATUS_LABELS[entry.toStatus];
  const fromLabel = entry.fromStatus
    ? EXPENSE_STATUS_LABELS[entry.fromStatus]
    : null;
  return fromLabel ? `${fromLabel} → ${toLabel}` : toLabel;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Divider() {
  return (
    <div
      style={{ height: '1px', backgroundColor: 'var(--border)', flexShrink: 0 }}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-xs font-semibold uppercase tracking-wider"
      style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
    >
      {children}
    </span>
  );
}

function WarningIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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

// ─── Budget progress bar ──────────────────────────────────────────────────────

function getProgressColor(pct: number): string {
  if (pct > 80) return 'var(--danger)';
  if (pct >= 60) return 'var(--warning)';
  return 'var(--success)';
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ManagerActionPanelProps {
  expense: Expense;
  budgetSummaries: BudgetSummary[];
  onAction: () => void;
  onShowToast: (message: string, type: ToastType) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ManagerActionPanel({
  expense,
  budgetSummaries,
  onAction,
  onShowToast,
}: ManagerActionPanelProps) {
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'approve' | 'return' | 'reject' | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [textareaFocused, setTextareaFocused] = useState(false);

  // Reset all local state when the selected expense changes
  useEffect(() => {
    setRemarks('');
    setRemarksError(null);
    setActionError(null);
    setLoading(null);
    setHistoryExpanded(false);
  }, [expense.id]);

  // ── Budget calculations ────────────────────────────────────────────────────

  const budgetSummary =
    budgetSummaries.find((b) => b.departmentId === expense.departmentId) ?? null;

  const wouldExceedBudget = budgetSummary
    ? budgetSummary.approvedSum + expense.amount > budgetSummary.allocatedBudget
    : false;

  const currentUtilPct = budgetSummary?.utilizationPercent ?? 0;

  // ── Receipt check ──────────────────────────────────────────────────────────

  const hasReceipt = expense.receipts && expense.receipts.length > 0;

  // ── Disable conditions ────────────────────────────────────────────────────

  const approveDisabled = !hasReceipt || wouldExceedBudget;
  const isActioning = loading !== null;

  // ── History ───────────────────────────────────────────────────────────────

  const sortedHistory = [...(expense.statusHistory ?? [])].sort(
    (a, b) =>
      new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleApprove = async () => {
    setActionError(null);
    setLoading('approve');
    try {
      await expensesApi.managerApprove(expense.id);
      onShowToast('Expense approved and sent to Accounts', 'success');
      onAction();
    } catch (err: unknown) {
      setActionError(getApiErrorMessage(err, 'Failed to approve expense'));
    } finally {
      setLoading(null);
    }
  };

  const handleReturn = async () => {
    setRemarksError(null);
    setActionError(null);
    if (!remarks.trim()) {
      setRemarksError('Remarks are required when returning an expense.');
      return;
    }
    setLoading('return');
    try {
      await expensesApi.managerReturn(expense.id, remarks.trim());
      onShowToast('Expense returned to supervisor', 'warning');
      onAction();
    } catch (err: unknown) {
      setActionError(getApiErrorMessage(err, 'Failed to return expense'));
    } finally {
      setLoading(null);
    }
  };

  const handleRejectClick = () => {
    setRemarksError(null);
    if (!remarks.trim()) {
      setRemarksError('Remarks are required when rejecting an expense.');
      return;
    }
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    setShowRejectModal(false);
    setActionError(null);
    setLoading('reject');
    try {
      await expensesApi.managerReject(expense.id, remarks.trim());
      onShowToast('Expense rejected', 'error');
      onAction();
    } catch (err: unknown) {
      setActionError(getApiErrorMessage(err, 'Failed to reject expense'));
    } finally {
      setLoading(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* ── Scrollable body ── */}
      <div className="flex flex-col gap-5 p-6 flex-1 overflow-y-auto">

        {/* ── Header: description + badge + amount ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h2
              className="text-xl font-bold leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: 'var(--text-primary)',
              }}
            >
              {expense.description}
            </h2>
            <Badge status={expense.status} className="shrink-0 mt-0.5" />
          </div>
          <span
            className="text-2xl font-bold"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: 'var(--accent-gold)',
            }}
          >
            {formatAmount(expense.amount, expense.currency)}
          </span>
        </div>

        <Divider />

        {/* ── Details grid ── */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {(
            [
              ['Department', expense.department?.name ?? '—'],
              ['Date', formatDate(expense.expenseDate)],
              ['Submitted By', expense.submittedByUser?.name ?? '—'],
              ['Currency', expense.currency],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span
                className="text-xs uppercase tracking-wide"
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {label}
              </span>
              <span
                className="text-sm"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        <Divider />

        {/* ── Receipt section ── */}
        <div className="flex flex-col gap-3">
          <SectionLabel>Receipt</SectionLabel>

          {hasReceipt ? (
            <div className="flex flex-col gap-3">
              {expense.receipts.map((receipt) => (
                <div key={receipt.id} className="flex flex-col gap-2">
                  {/* Thumbnail for images */}
                  {isImagePath(receipt.filePath) && (
                    <img
                      src={receipt.filePath}
                      alt="Receipt preview"
                      style={{
                        width: '100%',
                        maxHeight: '180px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}

                  {/* Link row */}
                  <div
                    className="flex items-center justify-between px-3 py-2.5 rounded"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span
                      className="text-sm"
                      style={{
                        color: 'var(--text-muted)',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      Receipt #{receipt.id.slice(-6).toUpperCase()}
                    </span>
                    <a
                      href={receipt.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium transition-colors duration-150 hover:opacity-80"
                      style={{
                        color: 'var(--accent-gold)',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      View Full Receipt ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded text-sm"
              style={{
                backgroundColor: 'rgba(153, 27, 27, 0.12)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <WarningIcon />
              No receipt attached — cannot approve
            </div>
          )}
        </div>

        <Divider />

        {/* ── Department Budget ── */}
        <div className="flex flex-col gap-3">
          <SectionLabel>Department Budget</SectionLabel>

          <Card goldAccent padding="sm">
            <div className="flex flex-col gap-3">
              <span
                className="text-sm font-medium"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {expense.department?.name ?? '—'}
              </span>

              {budgetSummary ? (
                <>
                  {/* Progress bar — CSS only */}
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      overflow: 'hidden',
                    }}
                    role="progressbar"
                    aria-valuenow={Math.round(currentUtilPct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Budget utilization: ${currentUtilPct.toFixed(1)}%`}
                  >
                    <div
                      style={{
                        width: `${Math.min(currentUtilPct, 100)}%`,
                        height: '100%',
                        backgroundColor: getProgressColor(currentUtilPct),
                        borderRadius: '9999px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  <span
                    className="text-xs"
                    style={{
                      color: 'var(--text-muted)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {expense.currency} {budgetSummary.approvedSum.toFixed(2)} of{' '}
                    {expense.currency} {budgetSummary.allocatedBudget.toFixed(2)}{' '}
                    used ({currentUtilPct.toFixed(1)}%)
                  </span>

                  {/* Over-budget warning */}
                  {wouldExceedBudget && (
                    <div
                      className="flex items-start gap-2 px-3 py-2.5 rounded text-xs"
                      style={{
                        backgroundColor: 'rgba(153, 27, 27, 0.12)',
                        border: '1px solid var(--danger)',
                        color: 'var(--danger)',
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: '1.5',
                      }}
                    >
                      <WarningIcon size={12} />
                      <span>
                        Approving this expense will exceed the department
                        budget. Producer override required.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <span
                  className="text-xs"
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Budget data unavailable
                </span>
              )}
            </div>
          </Card>
        </div>

        <Divider />

        {/* ── Remarks ── */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="manager-remarks"
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
          >
            Add Remarks
          </label>
          <textarea
            id="manager-remarks"
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              if (remarksError) setRemarksError(null);
            }}
            onFocus={() => setTextareaFocused(true)}
            onBlur={() => setTextareaFocused(false)}
            placeholder="Enter your remarks..."
            rows={3}
            style={{
              width: '100%',
              backgroundColor: '#1A1A1A',
              border: `1px solid ${
                remarksError
                  ? 'var(--danger)'
                  : textareaFocused
                  ? 'var(--accent-gold)'
                  : 'var(--border)'
              }`,
              borderRadius: '6px',
              padding: '10px 12px',
              color: 'var(--text-primary)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              lineHeight: '1.5',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
          />
          {remarksError && (
            <span
              className="text-xs"
              style={{ color: 'var(--danger)', fontFamily: 'Inter, sans-serif' }}
            >
              {remarksError}
            </span>
          )}
        </div>

        <Divider />

        {/* ── Status History Timeline (collapsed by default) ── */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setHistoryExpanded((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: 'var(--text-muted)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              transition: 'opacity 0.15s',
            }}
            className="hover:opacity-70"
          >
            <span>{historyExpanded ? '▾' : '▸'}</span>
            <span>
              {historyExpanded
                ? 'Hide History'
                : `Show History (${sortedHistory.length})`}
            </span>
          </button>

          {historyExpanded && (
            sortedHistory.length === 0 ? (
              <p
                className="text-sm"
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                No history yet
              </p>
            ) : (
              <div className="flex flex-col">
                {sortedHistory.map((entry, idx) => (
                  <div key={entry.id} className="flex gap-3">
                    {/* Dot + connector */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                        style={{
                          backgroundColor: getTimelineDotColor(entry.toStatus),
                        }}
                      />
                      {idx < sortedHistory.length - 1 && (
                        <div
                          className="w-px flex-1 my-1"
                          style={{
                            backgroundColor: 'var(--border)',
                            minHeight: '20px',
                          }}
                        />
                      )}
                    </div>

                    {/* Entry content */}
                    <div className="flex flex-col gap-0.5 pb-4">
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: 'var(--text-primary)',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {getTransitionLabel(entry)}
                      </span>
                      <span
                        className="text-xs"
                        style={{
                          color: 'var(--text-muted)',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {entry.performedByUser?.name ?? 'System'} ·{' '}
                        {formatDate(entry.performedAt)}
                      </span>
                      {entry.comment && (
                        <span
                          className="text-xs mt-0.5 italic"
                          style={{
                            color: 'var(--text-muted)',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          &ldquo;{entry.comment}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* ── Action error ── */}
        {actionError && (
          <div
            className="px-4 py-3 rounded text-sm"
            style={{
              backgroundColor: 'rgba(153, 27, 27, 0.15)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {actionError}
          </div>
        )}
      </div>

      {/* ── Sticky action buttons ── */}
      <div
        className="flex flex-col gap-2 p-6 shrink-0"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <Button
          variant="primary"
          loading={loading === 'approve'}
          disabled={approveDisabled || isActioning}
          onClick={handleApprove}
        >
          Approve
        </Button>
        <Button
          variant="secondary"
          loading={loading === 'return'}
          disabled={isActioning}
          onClick={handleReturn}
        >
          Return
        </Button>
        <Button
          variant="danger"
          loading={loading === 'reject'}
          disabled={isActioning}
          onClick={handleRejectClick}
        >
          Reject
        </Button>
      </div>

      {/* ── Reject confirmation modal ── */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Confirm Rejection"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={loading === 'reject'}
              onClick={handleRejectConfirm}
            >
              Confirm Reject
            </Button>
          </>
        }
      >
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
        >
          Are you sure you want to reject this expense? This action cannot be
          undone without resubmission.
        </p>
      </Modal>
    </div>
  );
}
