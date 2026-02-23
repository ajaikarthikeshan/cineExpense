import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide"
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        {...props}
        className={[
          'w-full bg-[#1A1A1A] border border-[var(--border)] rounded',
          'px-3 py-2 text-sm text-[var(--text-primary)]',
          'placeholder:text-[var(--text-muted)]',
          'transition-colors duration-150',
          'focus:outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]'
            : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      />

      {error && (
        <span className="text-xs text-[var(--danger)] mt-0.5">{error}</span>
      )}
    </div>
  );
}
