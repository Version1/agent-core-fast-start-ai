'use client';

import { cn } from '@/lib/utils';

type StatusChipProps = {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function StatusChip({ status, size = 'md', className }: StatusChipProps) {
  const normalized = status.toUpperCase().replace(/_/g, ' ');

  const getStatusStyles = () => {
    if (normalized.includes('APPROVED'))
      return 'bg-fast-green-light text-fast-approved border border-fast-teal/20';
    if (normalized.includes('DECLINED'))
      return 'bg-fast-red-light text-fast-declined border border-red-200';
    if (normalized.includes('READY FOR CASEWORKER REVIEW'))
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (normalized.includes('PENDING') || normalized.includes('REVIEW'))
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (normalized.includes('ESCALATED'))
      return 'bg-fast-orange-light text-fast-escalated border border-orange-200';
    if (normalized.includes('FAILED'))
      return 'bg-fast-red-light text-fast-declined border border-red-200';
    if (normalized.includes('VALIDATED') || normalized.includes('EXTRACTED') || normalized.includes('EVALUATED'))
      return 'bg-fast-green-light text-fast-approved border border-fast-teal/20';
    if (normalized.includes('AWAITING') || normalized.includes('INTAKE'))
      return 'bg-fast-purple-light text-purple-700 border border-purple-200';
    if (normalized.includes('URGENT'))
      return 'bg-red-50 text-fast-declined border border-red-200';
    if (normalized.includes('HIGH'))
      return 'bg-fast-orange-light text-fast-high border border-orange-200';
    if (normalized.includes('STANDARD') || normalized.includes('MEDIUM'))
      return 'bg-gray-50 text-fast-standard border border-gray-200';
    if (normalized.includes('LOW'))
      return 'bg-gray-50 text-fast-low border border-gray-200';
    return 'bg-gray-50 text-fast-muted border border-gray-200';
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-2xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full font-medium whitespace-nowrap',
        getStatusStyles(),
        sizes[size],
        className
      )}
    >
      {normalized}
    </span>
  );
}
