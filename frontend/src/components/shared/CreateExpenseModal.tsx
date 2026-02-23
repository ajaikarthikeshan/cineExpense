'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { expensesApi } from '@/lib/api/expenses';
import { departmentsApi } from '@/lib/api/departments';
import {
  createExpenseSchema,
  type CreateExpenseInput,
} from '@/lib/validators/expense';
import type { Department, Expense } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

type CreateExpenseResponse = Expense & { isDuplicateWarning?: boolean };

// ─── Shared form field styles ──────────────────────────────────────────────────

function selectStyle(hasError: boolean): React.CSSProperties {
  return {
    backgroundColor: '#1A1A1A',
    border: hasError ? '1px solid var(--danger)' : '1px solid var(--border)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s',
    width: '100%',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
  };
}

function textareaStyle(hasError: boolean): React.CSSProperties {
  return {
    backgroundColor: '#1A1A1A',
    border: hasError ? '1px solid var(--danger)' : '1px solid var(--border)',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    resize: 'none' as const,
  };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-medium uppercase tracking-wide"
      style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
    >
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span
      className="text-xs mt-0.5"
      style={{ color: 'var(--danger)', fontFamily: 'Inter, sans-serif' }}
    >
      {message}
    </span>
  );
}

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

function DuplicateWarning() {
  return (
    <div
      className="px-4 py-3 rounded text-sm"
      style={{
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        border: '1px solid var(--accent-gold)',
        color: 'var(--accent-gold)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      Similar expense detected for this department and date. Please verify
      before submitting.
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateExpenseModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateExpenseModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
  });

  // Fetch departments when modal opens
  useEffect(() => {
    if (!isOpen) return;
    departmentsApi
      .list()
      .then((res) => setDepartments(res.data.data))
      .catch(() => setDepartments([]));
  }, [isOpen]);

  const handleClose = useCallback(() => {
    reset();
    setApiError(null);
    setReceiptFile(null);
    setDuplicateWarning(false);
    onClose();
  }, [reset, onClose]);

  const onSubmit = async (data: CreateExpenseInput) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const res = await expensesApi.create(data);
      const expense = res.data as CreateExpenseResponse;

      if (receiptFile) {
        await expensesApi.uploadReceipt(expense.id, receiptFile);
      }

      if (expense.isDuplicateWarning) {
        setDuplicateWarning(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 3000);
      } else {
        onSuccess();
        handleClose();
      }
    } catch (err: unknown) {
      setApiError(
        err instanceof Error ? err.message : 'Failed to create expense'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setReceiptFile(file);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Submit New Expense">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* API Error */}
        {apiError && <ErrorBanner message={apiError} />}

        {/* Duplicate Warning */}
        {duplicateWarning && <DuplicateWarning />}

        {/* ── Department ── */}
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="create-dept">Department</FieldLabel>
          <select
            id="create-dept"
            {...register('departmentId')}
            style={selectStyle(!!errors.departmentId)}
          >
            <option value="">Select department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.departmentId?.message} />
        </div>

        {/* ── Amount ── */}
        <Input
          label="Amount"
          id="create-amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />

        {/* ── Expense Date ── */}
        <Input
          label="Expense Date"
          id="create-date"
          type="date"
          max={today}
          error={errors.expenseDate?.message}
          {...register('expenseDate')}
        />

        {/* ── Description ── */}
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="create-desc">Description</FieldLabel>
          <textarea
            id="create-desc"
            rows={3}
            placeholder="Brief description of the expense…"
            {...register('description')}
            style={textareaStyle(!!errors.description)}
          />
          <FieldError message={errors.description?.message} />
        </div>

        {/* ── Receipt Upload ── */}
        <div className="flex flex-col gap-1">
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
          >
            Receipt (Optional)
          </span>
          <div
            className="rounded border-2 border-dashed p-6 text-center cursor-pointer transition-colors duration-150"
            style={{
              borderColor: isDragOver
                ? 'var(--accent-gold)'
                : 'var(--border)',
              backgroundColor: isDragOver
                ? 'rgba(212,175,55,0.05)'
                : 'transparent',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {receiptFile ? (
              <p
                className="text-sm"
                style={{ color: 'var(--accent-gold)', fontFamily: 'Inter, sans-serif' }}
              >
                {receiptFile.name}
              </p>
            ) : (
              <p
                className="text-sm"
                style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
              >
                Drop receipt here or click to upload
              </p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* ── Actions ── */}
        <div
          className="flex justify-end gap-3 pt-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            Create Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}
