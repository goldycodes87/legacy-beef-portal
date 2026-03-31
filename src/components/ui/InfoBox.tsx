import React from 'react';
import { cn } from '@/lib/utils';

interface InfoBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'success' | 'tip';
  title?: string;
}

export function InfoBox({
  variant = 'info',
  title,
  className,
  children,
  ...props
}: InfoBoxProps) {
  const variantStyles = {
    info: 'bg-blue-50 border border-blue-200',
    warning: 'bg-amber-50 border border-amber-200',
    success: 'bg-brand-green-pale border border-green-200',
    tip: 'bg-brand-orange-light border border-brand-orange/30',
  };

  const emoji = {
    warning: '⚠️',
    success: '✓',
    tip: '💡',
    info: 'ℹ️',
  };

  return (
    <div
      className={cn('rounded-card p-4', variantStyles[variant], className)}
      {...props}
    >
      {title && (
        <p className="font-body font-semibold text-sm mb-2">
          {emoji[variant]} {title}
        </p>
      )}
      <div className="font-body text-sm text-gray-700">{children}</div>
    </div>
  );
}
