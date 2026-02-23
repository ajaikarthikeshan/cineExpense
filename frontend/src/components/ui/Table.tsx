'use client';

import React from 'react';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  selectedId?: string;
  loading?: boolean;
  emptyMessage?: string;
}

function SkeletonRow({ colCount }: { colCount: number }) {
  return (
    <tr className="border-b border-[var(--border)]">
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-[rgba(255,255,255,0.06)] animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export function Table({
  columns,
  data,
  onRowClick,
  selectedId,
  loading = false,
  emptyMessage = 'No records found.',
}: TableProps) {
  const isClickable = Boolean(onRowClick);

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]">
      <table className="w-full border-collapse text-sm">
        {/* ── Header ── */}
        <thead>
          <tr className="bg-[#1A1A1A]">
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} colCount={columns.length} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-[var(--text-muted)] text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const rowId = row.id as string | undefined;
              const isSelected = selectedId !== undefined && rowId === selectedId;

              return (
                <tr
                  key={rowId ?? Math.random()}
                  onClick={isClickable ? () => onRowClick!(row) : undefined}
                  className={[
                    'border-b border-[var(--border)] transition-colors duration-100',
                    isClickable ? 'cursor-pointer' : '',
                    isSelected
                      ? 'bg-[rgba(212,175,55,0.05)] border-l-[3px] border-l-[var(--accent-gold)]'
                      : isClickable
                      ? 'hover:bg-[rgba(212,175,55,0.03)]'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-[var(--text-primary)] whitespace-nowrap"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] as React.ReactNode) ?? '—'}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
