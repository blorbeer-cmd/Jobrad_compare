import { type ReactNode } from 'react';
import './Badge.css';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = 'neutral',
  className = '',
  children,
}: BadgeProps) {
  return (
    <span className={`badge badge--${variant} ${className}`}>
      {children}
    </span>
  );
}
