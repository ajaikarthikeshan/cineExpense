import React from 'react';

type PaddingSize = 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  goldAccent?: boolean;
  padding?: PaddingSize;
  className?: string;
}

const paddingClasses: Record<PaddingSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  goldAccent = false,
  padding = 'md',
  className = '',
}: CardProps) {
  return (
    <div
      className={[
        'bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg',
        goldAccent ? 'border-t-2 border-t-[var(--accent-gold)]' : '',
        paddingClasses[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
