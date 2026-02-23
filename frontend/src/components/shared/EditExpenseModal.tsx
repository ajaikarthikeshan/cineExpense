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

// ─── Shared field helpers (mirrors CreateExpenseModal) ─────────────────────────

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

// ─── Props ─────────────────────────────────────────────────────────────────────

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditExpenseModal({
  isOpen,
  onClose,
  expense,
  onSuccess,
}: EditExpenseModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [newReceiptFile, setNewReceiptFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      departmentId: expense.departmentId,
      amount: expense.amount,
      expenseDate: expense.expenseDate.split('T')[0],
      description: expense.description,
    },
  });

  // Re-populate form and fetch departments when modal opens
  useEffect(() => {
    if (!isOpen) return;
    reset({
      departmentId: expense.departmentId,
      amount: expense.amount,
      expenseDate: expense.expenseDate.split('T')[0],
      description: expense.description,
    });
    departmentsApi
      .list()
      .then((res) => setDepartments(res.data.data))
      .catch(() => setDepartments([]));
  }, [isOpen, expense, reset]);

  const handleClose = useCallback(() => {
    setApiError(null);
    setNewReceiptFile(null);
    onClose();
  }, [onClose]);

  const onSubmit = async (data: CreateExpenseInput) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      await expensesApi.update(expense.id, data);
      if (newReceiptFile) {
        await expensesApi.uploadReceipt(expense.id, newReceiptFile);
      }
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      setApiError(
        err instanceof Error ? err.message : 'Failed to update expense'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setNewReceiptFile(file);
  };

  const today = new Date().toISOString().split('T')[0];
  const existingReceipt = expense.receipts?.[0] ?? null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Expense">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* API Error */}
        {apiError && <ErrorBanner message={apiError} />}

        {/* ── Department ── */}
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="edit-dept">Department</FieldLabel>
          <select
            id="edit-dept"
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
          id="edit-amount"
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
          id="edit-date"
          type="date"
          max={today}
          error={errors.expenseDate?.message}
          {...register('expenseDate')}
        />

        {/* ── Description ── */}
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="edit-desc">Description</FieldLabel>
          <textarea
            id="edit-desc"
            rows={3}
            placeholder="Brief description of the expense…"
            {...register('description')}
            style={textareaStyle(!!errors.description)}
          />
          <FieldError message={errors.description?.message} />
        </div>

        {/* ── Receipt Section ── */}
        <div className="flex flex-col gap-2">
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
          >
            Receipt
          </span>

          {/* Existing receipt preview (when no new file chosen) */}
          {existingReceipt && !newReceiptFile && (
            <div
              className="flex items-center justify-between px-3 py-2.5 rounded"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
              }}
            >
              <span
                className="text-sm"
                style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
              >
                Receipt #{existingReceipt.id.slice(-6).toUpperCase()}
              </span>
              <a
                href={existingReceipt.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:opacity-80 transition-opacity duration-150"
                style={{ color: 'var(--accent-gold)', fontFamily: 'Inter, sans-serif' }}
              >
                View
              </a>
            </div>
          )}

          {/* Drop zone */}
          <div
            className="rounded border-2 border-dashed p-5 text-center cursor-pointer transition-colors duration-150"
            style={{
              borderColor: isDragOver ? 'var(--accent-gold)' : 'var(--border)',
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
            {newReceiptFile ? (
              <p
                className="text-sm"
                style={{ color: 'var(--accent-gold)', fontFamily: 'Inter, sans-serif' }}
              >
                {newReceiptFile.name}
              </p>
            ) : (
              <p
                className="text-sm"
                style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
              >
                {existingReceipt
                  ? 'Replace receipt — drop here or click'
                  : 'Drop receipt here or click to upload'}
              </p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => setNewReceiptFile(e.target.files?.[0] ?? null)}
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
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
