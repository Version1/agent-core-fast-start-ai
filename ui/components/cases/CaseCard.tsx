'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { MockCase } from '@/types';

type CaseCardProps = { case: MockCase };

export function CaseCard({ case: c }: CaseCardProps) {
  const statusColors: Record<string, string> = {
    APPROVED:    'bg-fast-green-light text-fast-approved',
    DECLINED:    'bg-fast-red-light text-fast-declined',
    ESCALATED:   'bg-fast-orange-light text-fast-escalated',
    PENDING:     'bg-amber-50 text-amber-700',
    IN_PROGRESS: 'bg-fast-teal-light text-fast-teal',
  };

  const priorityColors: Record<string, string> = {
    URGENT:   'text-fast-urgent',
    HIGH:     'text-fast-high',
    STANDARD: 'text-fast-standard',
    LOW:      'text-fast-muted',
  };

  return (
    <Link
      href={`/cases/${c.id}`}
      className="block bg-fast-panel rounded-card border border-gray-200 p-4 hover:border-fast-teal/30 transition-colors border-l-4 border-l-fast-teal"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-fast-teal">{c.id}</span>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-2xs font-medium ${statusColors[c.status] ?? 'bg-gray-50 text-fast-muted'}`}>
              {c.status.replace('_', ' ')}
            </span>
            <span className={`text-2xs font-medium ${priorityColors[c.priority] ?? 'text-fast-muted'}`}>
              {c.priority}
            </span>
          </div>
          <p className="text-sm text-fast-text mt-2 truncate">{c.applicantName}</p>
          <p className="text-2xs text-fast-muted mt-1">
            {new Date(c.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-fast-muted flex-shrink-0 mt-0.5" />
      </div>
    </Link>
  );
}
