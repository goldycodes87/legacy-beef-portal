import React from 'react';
import { cn } from '@/lib/utils';

interface OptionCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: string;
  title: string;
  description?: string;
  badge?: { text: string; type: 'value' | 'premium' };
  note?: string;
}

export function OptionCard({
  selected = false,
  icon,
  title,
  description,
  badge,
  note,
  className,
  disabled,
  ...props
}: OptionCardProps) {
  const badgeStyles = {
    value: 'bg-brand-orange text-white',
    premium: 'bg-brand-green text-white',
  };

  return (
    <button
      className={cn(
        'min-h-[120px] w-full rounded-card border-2 p-4 text-left transition-all duration-150',
        selected
          ? 'border-brand-orange bg-brand-orange-light shadow-md'
          : 'border-brand-gray-light bg-white hover:border-brand-orange/50 hover:-translate-y-0.5 hover:shadow-md',
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          {icon && <span className="text-2xl">{icon}</span>}
          <div>
            <p className="font-body font-semibold text-base">{title}</p>
            {description && (
              <p className="font-body text-sm text-brand-gray mt-1">{description}</p>
            )}
          </div>
        </div>
        {badge && (
          <span className={cn('rounded-badge px-3 py-1 text-xs font-semibold whitespace-nowrap', badgeStyles[badge.type])}>
            {badge.text}
          </span>
        )}
      </div>
      {note && <p className="font-body text-xs text-brand-gray mt-2">{note}</p>}
      {disabled && <p className="font-body text-xs text-red-600 mt-2">Sold Out</p>}
    </button>
  );
}
