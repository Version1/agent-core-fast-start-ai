'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, UserPlus, UserMinus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCases } from '@/hooks/useCases';
import { useAuth } from '@/contexts/AuthContext';
import { assignCase, unassignCase } from '@/lib/api';
import { StatusChip } from '@/components/ui';
import type { CaseStatus, Priority } from '@/types';

const ASSIGNABLE_STATUSES: CaseStatus[] = [
  'READY_FOR_CASEWORKER_REVIEW', 'PENDING', 'IN_PROGRESS',
];

const PAGE_SIZE = 10;

const FRONTEND_VISIBLE_STATUSES: CaseStatus[] = [
  'READY_FOR_CASEWORKER_REVIEW',
  'PENDING', 'IN_PROGRESS', 'APPROVED', 'DECLINED', 'ESCALATED',
];
const PRIORITY_OPTIONS: Priority[] = ['URGENT', 'HIGH', 'STANDARD', 'LOW'];

export default function CasesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState<string>('');
  const [priorityFilter, setPriority] = useState<string>('');
  const [page, setPage]             = useState(1);
  const [assigning, setAssigning]   = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);

  const { data: apiData, isLoading, isError, error } = useCases({ status: statusFilter || undefined });

  const cases = apiData?.cases
    ?.filter((c) => FRONTEND_VISIBLE_STATUSES.includes(c.status))
    .map((c) => ({
      id: c.caseId,
      applicantName: c.applicantName,
      applicationType: c.applicationType,
      status: c.status,
      priority: c.priority,
      assignedTo: c.assignedTo,
      assignedToName: c.assignedToName,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      aiConfidence: c.aiConfidence,
    })) ?? [];

  const myCurrentCase = user
    ? cases.find(
        (c) => c.assignedTo === user.id && ASSIGNABLE_STATUSES.includes(c.status as CaseStatus)
      )
    : undefined;

  const handleAssignNew = async () => {
    if (!user || assigning) return;
    const unassignedCases = cases
      .filter(
        (c) =>
          !c.assignedTo &&
          ASSIGNABLE_STATUSES.includes(c.status as CaseStatus) &&
          c.status !== 'ESCALATED'
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (unassignedCases.length === 0) {
      alert('No unassigned cases available at this time.');
      return;
    }

    const oldest = unassignedCases[0];
    setAssigning(true);
    try {
      await assignCase(oldest.id, user.id, user.name);
      await queryClient.invalidateQueries({ queryKey: ['cases'] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to assign case: ${msg}`);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (caseId?: string) => {
    const targetId = caseId || myCurrentCase?.id;
    if (!targetId) return;
    if (caseId) {
      setUnassigningId(caseId);
    } else {
      setUnassigning(true);
    }
    try {
      await unassignCase(targetId, user?.name);
      await queryClient.invalidateQueries({ queryKey: ['cases'] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to unassign case: ${msg}`);
    } finally {
      setUnassigning(false);
      setUnassigningId(null);
    }
  };

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.applicantName.toLowerCase().includes(q);
      const matchStatus   = !statusFilter   || c.status   === statusFilter;
      const matchPriority = !priorityFilter || c.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [cases, search, statusFilter, priorityFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = () => setPage(1);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12 text-fast-muted text-sm">Loading cases...</div>
      </div>
    );
  }

  if (isError) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700">
          <strong>Failed to load cases:</strong> {errMsg}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fast-text">Case Management</h1>
          <p className="text-sm text-fast-muted mt-1">Review and manage all assigned cases</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {myCurrentCase ? (
            <button
              onClick={() => handleUnassign()}
              disabled={unassigning}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-fast-text rounded text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <UserMinus className="w-4 h-4" />
              {unassigning ? 'Unassigning...' : 'Unassign current case'}
            </button>
          ) : (
            <button
              onClick={handleAssignNew}
              disabled={assigning}
              className="inline-flex items-center gap-2 px-4 py-2 bg-fast-teal text-white rounded text-sm font-medium hover:bg-fast-teal/90 transition-colors disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {assigning ? 'Assigning...' : 'Assign new case'}
            </button>
          )}
        </div>
      </div>

      {/* Currently assigned case metadata */}
      {myCurrentCase && (
        <div className="mb-4 bg-fast-teal-light border border-fast-teal/20 rounded-card p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-fast-teal/10 rounded flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4 text-fast-teal" />
            </div>
            <div className="min-w-0">
              <p className="text-2xs font-medium text-fast-muted uppercase tracking-wide">Your assigned case</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Link href={`/cases/${myCurrentCase.id}`} className="text-sm font-semibold text-fast-teal hover:underline">
                  {myCurrentCase.id}
                </Link>
                <span className="text-sm text-fast-text truncate">&mdash; {myCurrentCase.applicantName}</span>
                <StatusChip status={myCurrentCase.status} size="sm" />
                <StatusChip status={myCurrentCase.priority} size="sm" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/cases/${myCurrentCase.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-fast-teal text-white rounded text-xs font-medium hover:bg-fast-teal/90 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open case
            </Link>
            <button
              onClick={() => handleUnassign()}
              disabled={unassigning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-fast-text rounded text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <UserMinus className="w-3 h-3" />
              {unassigning ? 'Unassigning...' : 'Unassign'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 bg-fast-panel rounded-card border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              placeholder="Search by case ID or applicant name..."
              className="w-full px-3 py-2 pl-9 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-fast-teal/30 focus:border-fast-teal"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-fast-muted" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatus(e.target.value); resetPage(); }}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-fast-teal/30 focus:border-fast-teal"
          >
            <option value="">All Statuses</option>
            {FRONTEND_VISIBLE_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => { setPriority(e.target.value); resetPage(); }}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-fast-teal/30 focus:border-fast-teal"
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {(search || statusFilter || priorityFilter) && (
            <button
              onClick={() => { setSearch(''); setStatus(''); setPriority(''); resetPage(); }}
              className="px-3 py-2 text-sm text-fast-muted hover:text-fast-text"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-fast-panel rounded-card border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Case ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Applicant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Assigned To</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Updated</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-fast-muted uppercase tracking-wider">AI Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-fast-muted text-sm">
                  No cases match your filters.
                </td>
              </tr>
            ) : (
              paginated.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/cases/${c.id}`}
                      className="text-sm font-medium text-fast-teal hover:underline"
                    >
                      {c.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-fast-text">{c.applicantName}</td>
                  <td className="px-4 py-3 text-sm text-fast-text">{c.applicationType}</td>
                  <td className="px-4 py-3">
                    <StatusChip status={c.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${
                      c.priority === 'URGENT'   ? 'text-fast-urgent' :
                      c.priority === 'HIGH'     ? 'text-fast-high' :
                      c.priority === 'STANDARD' ? 'text-fast-standard' :
                                                  'text-fast-muted'
                    }`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {c.assignedToName ? (
                        c.assignedTo === user?.id ? (
                          <span className="text-fast-approved font-medium">{c.assignedToName} (you)</span>
                        ) : (
                          <span className="text-fast-text">{c.assignedToName}</span>
                        )
                      ) : (
                        <span className="text-fast-muted italic">Unassigned</span>
                      )}
                      {user?.role === 'MANAGER' && c.assignedToName && (
                        <button
                          onClick={() => handleUnassign(c.id)}
                          disabled={unassigningId === c.id}
                          className="text-2xs text-fast-muted hover:text-fast-declined font-medium px-1.5 py-0.5 rounded border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {unassigningId === c.id ? '...' : 'Unassign'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-fast-muted tabular-nums">
                    {new Date(c.updatedAt).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">
                    {c.aiConfidence !== undefined ? (
                      <span className={c.aiConfidence < 50 ? 'text-fast-declined font-medium' : 'text-fast-approved font-medium'}>
                        {c.aiConfidence}%
                      </span>
                    ) : (
                      <span className="text-fast-muted">--</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center bg-gray-50/50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm text-fast-muted hover:text-fast-text disabled:opacity-40"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded text-sm font-medium ${
                    p === page
                      ? 'bg-fast-teal text-white'
                      : 'text-fast-text hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm text-fast-muted hover:text-fast-text disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/30">
          <p className="text-xs text-fast-muted">
            Showing {paginated.length} of {filtered.length} cases
          </p>
        </div>
      </div>
    </div>
  );
}
