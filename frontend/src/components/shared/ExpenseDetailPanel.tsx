'use client';

import React, { useState, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { expensesApi } from '@/lib/api/expenses';
import { useAuthStore } from '@/store/auth.store';
import { EXPENSE_STATUS_LABELS } from '@/lib/constants/roles';
import type { Expense, ExpenseStatus, ExpenseStatusHistory } from '@/types';

// ─── Extended type for API response extras ─────────────────────────────────────

export type ExpenseWithWarning = Expense & { isDuplicateWarning?: boolean };

// ─── Constants ─────────────────────────────────────────────────────────────────

const EDITABLE_STATUSES: ExpenseStatus[] = [
  'Draft',
  'ManagerReturned',
  'ManagerRejected',
  'AccountsReturned',
];

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

function getTimelineDotColor(toStatus: ExpenseStatus): string {
  if (
    toStatus === 'ManagerApproved' ||
    toStatus === 'AccountsApproved' ||
    toStatus === 'Paid'
  ) {
    return 'var(--accent-gold)';
  }
  if (toStatus === 'ManagerRejected') {
    return 'var(--danger)';
  }
  if (toStatus === 'ManagerReturned' || toStatus === 'AccountsReturned') {
    return 'var(--warning)';
  }
  if (toStatus === 'Submitted') {
    return '#93C5FD';
  }
  return 'var(--text-muted)';
}

function getTransitionLabel(entry: ExpenseStatusHistory): string {
  const toLabel = EXPENSE_STATUS_LABELS[entry.toStatus];
  const fromLabel = entry.fromStatus ? EXPENSE_STATUS_LABELS[entry.fromStatus] : null;
  return fromLabel ? `${fromLabel} → ${toLabel}` : toLabel;
}

// ─── Divider ───────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div
      style={{ height: '1px', backgroundColor: 'var(--border)', flexShrink: 0 }}
    />
  );
}

// ─── Section Label ─────────────────────────────────────────────────────────────

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

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ExpenseDetailPanelProps {
  expense: ExpenseWithWarning;
  onRefresh: () => void;
  onEdit?: (expense: Expense) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExpenseDetailPanel({
  expense,
  onRefresh,
  onEdit,
}: ExpenseDetailPanelProps) {
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitter = user?.id === expense.submittedBy;
  const isEditable = EDITABLE_STATUSES.includes(expense.status);
  const isSupervisor = user?.role === 'SUPERVISOR';

  const showSubmitButton =
    isSupervisor &&
    isSubmitter &&
    (expense.status === 'Draft' ||
      expense.status === 'ManagerReturned' ||
      expense.status === 'ManagerRejected' ||
      expense.status === 'AccountsReturned');

  const showEditButton = showSubmitButton && !!onEdit;

  // Status history sorted newest → oldest (top → bottom)
  const sortedHistory = [...(expense.statusHistory ?? [])].sort(
    (a, b) =>
      new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      await expensesApi.submit(expense.id);
      onRefresh();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to submit expense'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiptUpload = async (file: File) => {
    setUploadingReceipt(true);
    setActionError(null);
    try {
      await expensesApi.uploadReceipt(expense.id, file);
      onRefresh();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to upload receipt'
      );
    } finally {
      setUploadingReceipt(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Scrollable content */}
      <div className="flex flex-col gap-5 p-6 flex-1 overflow-y-auto">

        {/* ── Duplicate Warning ── */}
        {expense.isDuplicateWarning && (
          <div
            className="px-4 py-3 rounded text-sm"
            style={{
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid var(--accent-gold)',
              color: 'var(--accent-gold)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Similar expense detected for this department and date. Please
            verify before submitting.
          </div>
        )}

        {/* ── Header ── */}
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

        {/* ── Details Grid ── */}
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

        {/* ── Receipt Section ── */}
        <div className="flex flex-col gap-3">
          <SectionLabel>Receipt</SectionLabel>

          {expense.receipts && expense.receipts.length > 0 ? (
            <div className="flex flex-col gap-2">
              {expense.receipts.map((receipt) => (
                <div
                  key={receipt.id}
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
                    View Receipt
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p
              className="text-sm"
              style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
            >
              No receipt uploaded
            </p>
          )}

          {/* Upload button — only for submitter in editable state */}
          {isSubmitter && isEditable && (
            <>
              <Button
                variant="secondary"
                size="sm"
                loading={uploadingReceipt}
                onClick={() => fileInputRef.current?.click()}
              >
                {expense.receipts?.length ? 'Replace Receipt' : 'Upload Receipt'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleReceiptUpload(file);
                }}
              />
            </>
          )}
        </div>

        <Divider />

        {/* ── Status History Timeline ── */}
        <div className="flex flex-col gap-3">
          <SectionLabel>Status History</SectionLabel>

          {sortedHistory.length === 0 ? (
            <p
              className="text-sm"
              style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
            >
              No history yet
            </p>
          ) : (
            <div className="flex flex-col">
              {sortedHistory.map((entry, idx) => (
                <div key={entry.id} className="flex gap-3">
                  {/* Dot + connector line */}
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
          )}
        </div>

        {/* ── Action Error ── */}
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

      {/* ── Sticky Action Buttons ── */}
      {(showSubmitButton || showEditButton) && (
        <div
          className="flex flex-col gap-2 p-6 shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {showSubmitButton && (
            <Button variant="primary" loading={submitting} onClick={handleSubmit}>
              {expense.status === 'Draft' ? 'Submit Expense' : 'Resubmit'}
            </Button>
          )}
          {showEditButton && (
            <Button variant="secondary" onClick={() => onEdit!(expense)}>
              Edit
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
