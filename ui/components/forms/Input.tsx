'use client';

import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-fast-text placeholder:text-fast-muted focus:border-fast-teal focus:outline-none focus:ring-1 focus:ring-fast-teal/30',
        className
      )}
      {...props}
    />
  );
}
