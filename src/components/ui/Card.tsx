import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'selected' | 'success' | 'warning' | 'dark';
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: 'bg-white border border-brand-gray-light shadow-sm rounded-card',
    selected: 'bg-brand-orange-light border-2 border-brand-orange rounded-card',
    success: 'bg-brand-green-pale border border-green-200 rounded-card',
    warning: 'bg-amber-50 border border-amber-200 rounded-card',
    dark: 'bg-brand-green text-white rounded-card',
  };

  const paddingStyles = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(variantStyles[variant], paddingStyles[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}
