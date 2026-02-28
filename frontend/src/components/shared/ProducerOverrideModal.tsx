'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { expensesApi } from '@/lib/api/expenses';
import { getApiErrorMessage } from '@/lib/utils/api-error';
import type { Expense, BudgetSummary } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProducerOverrideModalProps {
  expense: Expense;
  budgetSummaries: BudgetSummary[];
  onSuccess: () => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProducerOverrideModal({
  expense,
  budgetSummaries,
  onSuccess,
  onClose,
}: ProducerOverrideModalProps) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  // ─── Derived budget calculations ────────────────────────────────────────────

  const budget =
    budgetSummaries.find((b) => b.departmentId === expense.departmentId) ?? null;
  const currentPct = budget?.utilizationPercent ?? 0;
  const projectedPct = budget
    ? ((budget.approvedSum + expense.amount) / budget.allocatedBudget) * 100
    : 0;
  const wouldExceed100 = projectedPct > 100;

  const projectedColor =
    projectedPct > 100
      ? 'var(--danger)'
      : projectedPct > 80
        ? 'var(--warning)'
        : 'var(--text-muted)';

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setReasonError(null);
    setApiError(null);

    if (reason.trim().length < 10) {
      setReasonError('Reason must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await expensesApi.producerOverride(expense.id, reason.trim());
      onSuccess();
    } catch (err: unknown) {
      setApiError(getApiErrorMessage(err, 'Failed to approve override. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Budget Override Request"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            Approve Override
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Expense summary card */}
        <Card padding="sm">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px 20px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'Inter, sans-serif',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '2px',
                }}
              >
                Department
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  color: 'var(--text-primary)',
                }}
              >
                {expense.department?.name ?? '—'}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'Inter, sans-serif',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '2px',
                }}
              >
                Amount
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontFamily: 'Cormorant Garamond, serif',
                  color: 'var(--accent-gold)',
                  fontWeight: 600,
                }}
              >
                {formatAmount(expense.amount, expense.currency)}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'Inter, sans-serif',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '2px',
                }}
              >
                Submitted By
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  color: 'var(--text-primary)',
                }}
              >
                {expense.submittedByUser?.name ?? '—'}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'Inter, sans-serif',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '2px',
                }}
              >
                Status
              </div>
              <Badge status={expense.status} />
            </div>

            {expense.description && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'Inter, sans-serif',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '2px',
                  }}
                >
                  Description
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    color: 'var(--text-primary)',
                  }}
                >
                  {expense.description}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Budget impact */}
        <div>
          <div
            style={{
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
            }}
          >
            Department Budget Impact
          </div>

          {budget ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontFamily: 'Inter, sans-serif',
                    color: 'var(--text-primary)',
                  }}
                >
                  {budget.departmentName}
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    fontFamily: 'Inter, sans-serif',
                    color: getProgressColor(currentPct),
                    fontWeight: 600,
                  }}
                >
                  {currentPct.toFixed(1)}% utilised
                </span>
              </div>

              {/* Current utilization bar */}
              <div
                style={{
                  height: '8px',
                  width: '100%',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(currentPct, 100)}%`,
                    backgroundColor: getProgressColor(currentPct),
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              {/* Projected utilization text */}
              <div
                style={{
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                  color: projectedColor,
                }}
              >
                Approving this expense would push{' '}
                <strong>{budget.departmentName}</strong> to{' '}
                <strong>{projectedPct.toFixed(1)}%</strong> utilization.
              </div>
            </>
          ) : (
            <div
              style={{
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                color: 'var(--text-muted)',
              }}
            >
              No budget data available for this department.
            </div>
          )}
        </div>

        {/* Over-budget warning banner */}
        {wouldExceed100 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: 'rgba(153, 27, 27, 0.15)',
              border: '1px solid var(--danger)',
              borderRadius: '6px',
            }}
          >
            {/* Warning icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--danger)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: '1px' }}
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span
              style={{
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                color: 'var(--danger)',
                lineHeight: '1.5',
              }}
            >
              This expense exceeds the total department budget. Proceed only if
              explicitly authorised.
            </span>
          </div>
        )}

        {/* Reason textarea */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
            }}
          >
            Override Reason <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (reasonError) setReasonError(null);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Explain why this budget exception is approved..."
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#1A1A1A',
              border: `1px solid ${
                reasonError
                  ? 'var(--danger)'
                  : focused
                    ? 'var(--accent-gold)'
                    : 'var(--border)'
              }`,
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: focused
                ? reasonError
                  ? '0 0 0 1px var(--danger)'
                  : '0 0 0 1px var(--accent-gold)'
                : 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          />
          {reasonError && (
            <div
              style={{
                marginTop: '4px',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                color: 'var(--danger)',
              }}
            >
              {reasonError}
            </div>
          )}
        </div>

        {/* API error banner */}
        {apiError && (
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
            {apiError}
          </div>
        )}
      </div>
    </Modal>
  );
}
