'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ReceiptPreview } from './ReceiptPreview';
import { expensesApi } from '@/lib/api/expenses';
import { EXPENSE_STATUS_LABELS } from '@/lib/constants/roles';
import type {
  Expense,
  ExpenseStatus,
  ExpenseStatusHistory,
  Payment,
} from '@/types';
import type { ToastType } from '@/hooks/useToast';

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

function todayISODate(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Timeline helpers (mirrors ManagerActionPanel) ────────────────────────────

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface AccountsActionPanelProps {
  expense: Expense;
  onAction: () => void;
  onShowToast: (message: string, type: ToastType) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AccountsActionPanel({
  expense,
  onAction,
  onShowToast,
}: AccountsActionPanelProps) {
  const expWithPayment = expense as ExpenseWithPayment;

  const mode =
    expense.status === 'ManagerApproved'
      ? 'verification'
      : expense.status === 'AccountsApproved'
      ? 'payment'
      : 'completed';

  // ── Verification state ────────────────────────────────────────────────────

  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'approve' | 'return' | 'paid' | null>(
    null
  );
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // ── Payment form state ────────────────────────────────────────────────────

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | null>(
    null
  );
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayISODate());
  const [paymentErrors, setPaymentErrors] = useState<{
    method?: string;
    reference?: string;
    date?: string;
  }>({});

  // Reset all local state when the selected expense changes
  useEffect(() => {
    setRemarks('');
    setRemarksError(null);
    setActionError(null);
    setLoading(null);
    setHistoryExpanded(false);
    setPaymentMethod(null);
    setReferenceNumber('');
    setPaymentDate(todayISODate());
    setPaymentErrors({});
  }, [expense.id]);

  // ── Derived values ────────────────────────────────────────────────────────

  const managerApprovalEntry = expense.statusHistory?.find(
    (h) => h.toStatus === 'ManagerApproved'
  );
  const approvedByManager =
    managerApprovalEntry?.performedByUser?.name ?? '—';

  const sortedHistory = [...(expense.statusHistory ?? [])].sort(
    (a, b) =>
      new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  );

  const isActioning = loading !== null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleApprove = async () => {
    setActionError(null);
    setLoading('approve');
    try {
      await expensesApi.accountsApprove(expense.id);
      onShowToast('Expense approved. Ready for payment.', 'success');
      onAction();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to approve expense'
      );
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
      await expensesApi.accountsReturn(expense.id, remarks.trim());
      onShowToast('Expense returned to supervisor.', 'warning');
      onAction();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to return expense'
      );
    } finally {
      setLoading(null);
    }
  };

  const handleMarkPaid = async () => {
    const errors: typeof paymentErrors = {};
    if (!paymentMethod) errors.method = 'Please select a payment method.';
    if (!referenceNumber.trim()) errors.reference = 'Transaction ID is required.';
    if (!paymentDate) {
      errors.date = 'Payment date is required.';
    } else if (paymentDate > todayISODate()) {
      errors.date = 'Payment date cannot be in the future.';
    }
    if (Object.keys(errors).length > 0) {
      setPaymentErrors(errors);
      return;
    }
    setPaymentErrors({});
    setActionError(null);
    setLoading('paid');
    try {
      await expensesApi.markPaid(expense.id, {
        paymentMethod: paymentMethod!,
        referenceNumber: referenceNumber.trim(),
        paymentDate,
      });
      onShowToast('Payment recorded successfully.', 'success');
      onAction();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to record payment'
      );
    } finally {
      setLoading(null);
    }
  };

  // ── Shared sections ────────────────────────────────────────────────────────

  const headerSection = (
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
  );

  const detailGrid = (
    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
      {(
        [
          ['Department', expense.department?.name ?? '—'],
          ['Date', formatDate(expense.expenseDate)],
          ['Submitted By', expense.submittedByUser?.name ?? '—'],
          ['Approved By Manager', approvedByManager],
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
  );

  const billPreview = (
    <ReceiptPreview
      receipts={expense.receipts ?? []}
      expenseId={expense.id}
      canUpload={false}
      onUploadSuccess={onAction}
    />
  );

  const actionErrorBanner = actionError ? (
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
  ) : null;

  const historyTimeline = (
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

      {historyExpanded &&
        (sortedHistory.length === 0 ? (
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
        ))}
    </div>
  );

  // ── Verification mode ──────────────────────────────────────────────────────

  if (mode === 'verification') {
    return (
      <div className="flex flex-col h-full">
        {/* Scrollable body */}
        <div className="flex flex-col gap-5 p-6 flex-1 overflow-y-auto">
          {headerSection}
          <Divider />
          {detailGrid}
          <Divider />
          {billPreview}
          <Divider />

          {/* Payment status toggle — visual only */}
          <div className="flex flex-col gap-2">
            <SectionLabel>Payment Status</SectionLabel>
            <div className="flex gap-2">
              {/* ✓ Paid — inactive in verification (not yet paid) */}
              <div
                aria-hidden="true"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  color: 'var(--text-muted)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  textAlign: 'center',
                  userSelect: 'none',
                }}
              >
                ✓ Paid
              </div>
              {/* Not Paid — active in verification */}
              <div
                aria-hidden="true"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '9999px',
                  border: '1px solid var(--accent-gold)',
                  backgroundColor: 'rgba(212,175,55,0.10)',
                  color: 'var(--accent-gold)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: 600,
                  textAlign: 'center',
                  userSelect: 'none',
                }}
              >
                Not Paid
              </div>
            </div>
          </div>

          <Divider />

          {/* Remarks */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="accounts-remarks"
              className="text-xs font-semibold uppercase tracking-wider"
              style={{
                color: 'var(--text-muted)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Add Remarks
            </label>
            <textarea
              id="accounts-remarks"
              value={remarks}
              onChange={(ev) => {
                setRemarks(ev.target.value);
                if (remarksError) setRemarksError(null);
              }}
              onFocus={() => setTextareaFocused(true)}
              onBlur={() => setTextareaFocused(false)}
              placeholder="Enter your remarks…"
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
                style={{
                  color: 'var(--danger)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {remarksError}
              </span>
            )}
          </div>

          <Divider />
          {historyTimeline}
          {actionErrorBanner}
        </div>

        {/* Sticky action buttons */}
        <div
          className="flex flex-col gap-2 p-6 shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <Button
            variant="primary"
            loading={loading === 'approve'}
            disabled={isActioning}
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
        </div>
      </div>
    );
  }

  // ── Payment mode ───────────────────────────────────────────────────────────

  if (mode === 'payment') {
    return (
      <div className="flex flex-col h-full">
        {/* Scrollable body */}
        <div className="flex flex-col gap-5 p-6 flex-1 overflow-y-auto">
          {headerSection}
          <Divider />
          {detailGrid}
          <Divider />
          {billPreview}
          <Divider />

          {/* Payment form */}
          <Card goldAccent padding="sm">
            <div className="flex flex-col gap-4">
              <h3
                className="text-lg font-bold"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: 'var(--text-primary)',
                }}
              >
                Record Payment
              </h3>

              {/* Payment method toggle */}
              <div className="flex flex-col gap-2">
                <SectionLabel>Payment Method</SectionLabel>
                <div className="flex gap-2">
                  {(['cash', 'bank'] as const).map((method) => {
                    const isActive = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        onClick={() => {
                          setPaymentMethod(method);
                          if (paymentErrors.method) {
                            setPaymentErrors((prev) => ({
                              ...prev,
                              method: undefined,
                            }));
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 8px',
                          borderRadius: '6px',
                          border: `1px solid ${
                            isActive
                              ? 'var(--accent-gold)'
                              : 'var(--border)'
                          }`,
                          backgroundColor: isActive
                            ? 'rgba(212,175,55,0.10)'
                            : 'rgba(255,255,255,0.02)',
                          color: isActive
                            ? 'var(--accent-gold)'
                            : 'var(--text-muted)',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          fontWeight: isActive ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {method === 'cash' ? 'CASH' : 'BANK TRANSFER'}
                      </button>
                    );
                  })}
                </div>
                {paymentErrors.method && (
                  <span
                    className="text-xs"
                    style={{
                      color: 'var(--danger)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {paymentErrors.method}
                  </span>
                )}
              </div>

              {/* Reference number */}
              <Input
                id="payment-reference"
                label="Transaction ID / Reference"
                placeholder="e.g. TRX98432156"
                value={referenceNumber}
                onChange={(ev) => {
                  setReferenceNumber(ev.target.value);
                  if (paymentErrors.reference) {
                    setPaymentErrors((prev) => ({
                      ...prev,
                      reference: undefined,
                    }));
                  }
                }}
                error={paymentErrors.reference}
              />

              {/* Payment date */}
              <Input
                id="payment-date"
                label="Payment Date"
                type="date"
                value={paymentDate}
                max={todayISODate()}
                onChange={(ev) => {
                  setPaymentDate(ev.target.value);
                  if (paymentErrors.date) {
                    setPaymentErrors((prev) => ({
                      ...prev,
                      date: undefined,
                    }));
                  }
                }}
                error={paymentErrors.date}
              />
            </div>
          </Card>

          {actionErrorBanner}
          <Divider />
          {historyTimeline}
        </div>

        {/* Mark as Paid — sticky footer */}
        <div
          className="p-6 shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <Button
            variant="primary"
            size="lg"
            loading={loading === 'paid'}
            disabled={isActioning}
            onClick={handleMarkPaid}
            className="w-full"
          >
            Mark as Paid
          </Button>
        </div>
      </div>
    );
  }

  // ── Completed mode (read-only) ─────────────────────────────────────────────

  const paidEntry = expense.statusHistory?.find((h) => h.toStatus === 'Paid');
  const paymentRecord = expWithPayment.payment;

  const paymentMethodLabel = paymentRecord?.paymentMethod
    ? paymentRecord.paymentMethod === 'cash'
      ? 'CASH'
      : 'BANK TRANSFER'
    : '—';

  const paidOnDate = paymentRecord?.paymentDate
    ? formatDate(paymentRecord.paymentDate)
    : paidEntry
    ? formatDate(paidEntry.performedAt)
    : '—';

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-5 p-6 flex-1 overflow-y-auto">
        {headerSection}
        <Divider />

        {/* Extended detail grid for completed view */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {(
            [
              ['Department', expense.department?.name ?? '—'],
              ['Date', formatDate(expense.expenseDate)],
              ['Submitted By', expense.submittedByUser?.name ?? '—'],
              ['Approved By Manager', approvedByManager],
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
        {billPreview}
        <Divider />

        {/* Payment record summary */}
        <div className="flex flex-col gap-3">
          <SectionLabel>Payment Record</SectionLabel>

          <div
            style={{
              border: '1px solid rgba(21,128,61,0.3)',
              borderRadius: '8px',
              backgroundColor: 'rgba(21,128,61,0.06)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {(
              [
                ['Payment Method', paymentMethodLabel],
                ['Reference No.', paymentRecord?.referenceNumber ?? '—'],
                ['Paid On', paidOnDate],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3"
              >
                <span
                  className="text-xs uppercase tracking-wide"
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {label}
                </span>
                {label === 'Payment Method' && paymentRecord ? (
                  <Badge variant="success">
                    {paymentRecord.paymentMethod === 'cash' ? 'CASH' : 'BANK'}
                  </Badge>
                ) : (
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <Divider />
        {historyTimeline}
      </div>
    </div>
  );
}
