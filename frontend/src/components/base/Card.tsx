import { type HTMLAttributes, type ReactNode } from 'react';
import './Card.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlighted' | 'cheapest';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...rest
}: CardProps) {
  const classes = [
    'card',
    `card--${variant}`,
    `card--pad-${padding}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

/* Sub-components */
export function CardHeader({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`card__header ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`card__body ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`card__footer ${className}`} {...rest}>
      {children}
    </div>
  );
}
