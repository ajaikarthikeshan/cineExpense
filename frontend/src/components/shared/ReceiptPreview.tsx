'use client';

import React, { useRef, useState } from 'react';
import { expensesApi } from '@/lib/api/expenses';
import { getApiErrorMessage } from '@/lib/utils/api-error';
import type { ExpenseReceipt } from '@/types';

// ─── Icons ────────────────────────────────────────────────────────────────────

function DocumentIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getFileName(filePath: string): string {
  return filePath.split('/').pop() ?? filePath;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReceiptPreviewProps {
  receipts: ExpenseReceipt[];
  expenseId: string;
  canUpload: boolean;
  onUploadSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReceiptPreview({
  receipts,
  expenseId,
  canUpload,
  onUploadSuccess,
}: ReceiptPreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const hasReceipts = receipts.length > 0;
  const firstReceipt = receipts[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      await expensesApi.uploadReceipt(expenseId, file);
      onUploadSuccess();
    } catch (err: unknown) {
      setUploadError(getApiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Section label — Cormorant Garamond per spec */}
      <span
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '0.01em',
        }}
      >
        Bill Preview
      </span>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        aria-label="Upload receipt"
      />

      {hasReceipts ? (
        <div className="flex flex-col gap-2">
          {/* Receipt preview card */}
          <div
            style={{
              border: '1px solid var(--gold-border)',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: 'rgba(212,175,55,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Icon + filename + date */}
            <div className="flex items-center gap-3">
              <span style={{ color: 'var(--accent-gold)', flexShrink: 0 }}>
                <DocumentIcon size={28} />
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span
                  className="text-sm font-medium truncate"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {getFileName(firstReceipt.filePath)}
                </span>
                <span
                  className="text-xs"
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Uploaded {formatDate(firstReceipt.uploadedAt)}
                </span>
              </div>
            </div>

            {/* View Receipt link styled as secondary button */}
            <a
              href={firstReceipt.filePath}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                border: '1px solid var(--accent-gold)',
                backgroundColor: 'transparent',
                color: 'var(--accent-gold)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'background-color 0.15s',
                alignSelf: 'flex-start',
              }}
              className="hover:bg-[rgba(212,175,55,0.10)]"
            >
              View Receipt ↗
            </a>
          </div>

          {/* Replace receipt link */}
          {canUpload && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                background: 'none',
                border: 'none',
                cursor: uploading ? 'not-allowed' : 'pointer',
                padding: '0',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                color: 'var(--text-muted)',
                opacity: uploading ? 0.5 : 1,
                textAlign: 'left',
                textDecoration: 'underline',
                transition: 'opacity 0.15s',
                alignSelf: 'flex-start',
              }}
              className="hover:opacity-70"
            >
              {uploading ? 'Uploading…' : 'Replace Receipt'}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Empty state */}
          <div
            style={{
              border: '1.5px dashed var(--border)',
              borderRadius: '8px',
              padding: '28px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255,255,255,0.01)',
            }}
          >
            <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
              <DocumentIcon size={36} />
            </span>
            <span
              className="text-sm"
              style={{
                color: 'var(--text-muted)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              No receipt uploaded
            </span>
          </div>

          {canUpload && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                padding: '8px 14px',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                color: uploading ? 'var(--text-muted)' : 'var(--text-primary)',
                opacity: uploading ? 0.7 : 1,
                transition: 'border-color 0.15s, opacity 0.15s',
                alignSelf: 'flex-start',
              }}
              className="hover:border-[var(--accent-gold)]"
            >
              <UploadIcon />
              {uploading ? 'Uploading…' : 'Upload Receipt'}
            </button>
          )}
        </div>
      )}

      {uploadError && (
        <span
          className="text-xs"
          style={{ color: 'var(--danger)', fontFamily: 'Inter, sans-serif' }}
        >
          {uploadError}
        </span>
      )}
    </div>
  );
}
