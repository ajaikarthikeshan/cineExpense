'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--accent-red)] text-white',
    'hover:bg-[var(--accent-red-hover)]',
    'focus-visible:ring-2 focus-visible:ring-[var(--accent-red)]',
  ].join(' '),
  secondary: [
    'bg-transparent border border-[var(--accent-gold)] text-[var(--accent-gold)]',
    'hover:bg-[rgba(212,175,55,0.10)]',
    'focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--text-muted)]',
    'hover:text-[var(--text-primary)] hover:bg-[rgba(212,175,55,0.05)]',
  ].join(' '),
  danger: [
    'bg-[var(--danger)] text-white',
    'hover:bg-[#7F1D1D]',
    'focus-visible:ring-2 focus-visible:ring-[var(--danger)]',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded',
  md: 'px-4 py-2 text-sm rounded',
  lg: 'px-6 py-3 text-base rounded',
};

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150',
        'focus:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
