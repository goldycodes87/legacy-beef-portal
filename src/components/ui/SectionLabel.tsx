import React from 'react';
import { cn } from '@/lib/utils';

interface SectionLabelProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function SectionLabel({ className, children, ...props }: SectionLabelProps) {
  return (
    <p
      className={cn(
        'font-body font-semibold text-xs uppercase tracking-widest text-brand-gray',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}
