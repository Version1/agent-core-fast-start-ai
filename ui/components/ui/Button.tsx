'use client';

import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded';
  const variants = {
    primary: 'bg-fast-teal text-white hover:bg-fast-teal/90 focus:ring-fast-teal',
    secondary: 'bg-white text-fast-text border border-gray-300 hover:bg-gray-50 focus:ring-gray-400',
    danger: 'bg-fast-declined text-white hover:bg-red-600 focus:ring-red-500',
    success: 'bg-fast-approved text-white hover:bg-fast-teal/90 focus:ring-fast-teal',
    warning: 'bg-fast-escalated text-white hover:bg-orange-600 focus:ring-orange-500',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
