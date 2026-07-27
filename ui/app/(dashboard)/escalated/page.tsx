'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, UserMinus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCases } from '@/hooks/useCases';
import { unassignCase } from '@/lib/api';
import { StatusChip } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function EscalatedCasesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { data: apiData } = useCases({ status: 'ESCALATED' });
  const [unassigningId, setUnassigningId] = useState<string | null>(null);

  const handleUnassign = async (caseId: string) => {
    setUnassigningId(caseId);
    try {
      await unassignCase(caseId, user?.name);
      await queryClient.invalidateQueries({ queryKey: ['cases'] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to unassign case: ${msg}`);
    } finally {
      setUnassigningId(null);
    }
  };

  // Escalated cases: Managers only — redirect Caseworker and Admin
  useEffect(() => {
    if (loading || !user) return;
    if (user.role !== 'MANAGER') {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'MANAGER') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fast-bg">
        <div className="text-fast-muted text-sm">Loading...</div>
      </div>
    );
  }

  const escalatedCases =
    apiData?.cases?.map((c) => ({
      id: c.caseId,
      applicantName: c.applicantName,
      applicationType: c.applicationType,
      status: c.status as any,
      priority: c.priority as any,
      assignedTo: c.assignedTo,
      assignedToName: c.assignedToName,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      aiConfidence: c.aiConfidence,
      applicantEmail: '',
      escalationReason: '',
    })) ?? [];

  const urgent   = escalatedCases.filter((c) => c.priority === 'URGENT').length;
  const high     = escalatedCases.filter((c) => c.priority === 'HIGH').length;
  const standard = escalatedCases.filter((c) => c.priority === 'STANDARD').length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-fast-text">Escalated Cases</h1>
        <p className="text-sm text-fast-muted mt-1">Cases requiring senior review or specialist assessment</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-fast-panel rounded-card border border-gray-200 p-5 border-l-4 border-fast-escalated">
          <p className="text-sm font-medium text-fast-muted mb-2">Total Escalated</p>
          <p className="text-3xl font-bold text-fast-escalated">{escalatedCases.length}</p>
          <p className="text-xs text-fast-muted mt-1">Awaiting review</p>
        </div>
        <div className="bg-fast-panel rounded-card border border-gray-200 p-5 border-l-4 border-fast-urgent">
          <p className="text-sm font-medium text-fast-muted mb-2">Urgent Priority</p>
          <p className="text-3xl font-bold text-fast-urgent">{urgent}</p>
          <p className="text-xs text-fast-muted mt-1">Immediate attention needed</p>
        </div>
        <div className="bg-fast-panel rounded-card border border-gray-200 p-5 border-l-4 border-fast-high">
          <p className="text-sm font-medium text-fast-muted mb-2">High Priority</p>
          <p className="text-3xl font-bold text-fast-high">{high}</p>
          <p className="text-xs text-fast-muted mt-1">Review soon</p>
        </div>
        <div className="bg-fast-panel rounded-card border border-gray-200 p-5 border-l-4 border-fast-standard">
          <p className="text-sm font-medium text-fast-muted mb-2">Standard</p>
          <p className="text-3xl font-bold text-fast-standard">{standard}</p>
          <p className="text-xs text-fast-muted mt-1">Regular review queue</p>
        </div>
      </div>

      {/* Escalated cases list */}
      <div className="space-y-4">
        {escalatedCases.length === 0 ? (
          <div className="bg-fast-panel rounded-card border border-gray-200 p-10 text-center">
            <p className="text-fast-muted text-sm">No escalated cases at this time.</p>
          </div>
        ) : (
          escalatedCases.map((c) => (
            <div key={c.id} className="bg-fast-panel rounded-card border border-gray-200 p-6 border-l-4 border-fast-escalated">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/cases/${c.id}`}
                    className="text-xl font-bold text-fast-teal hover:underline"
                  >
                    {c.id}
                  </Link>
                  <StatusChip status={c.status} size="sm" />
                  <StatusChip status={c.priority} size="sm" />
                </div>
                <Link
                  href={`/cases/${c.id}`}
                  className="px-4 py-2 bg-fast-teal text-white text-sm font-semibold rounded hover:bg-fast-teal transition-colors"
                >
                  <span className="inline-flex items-center gap-1">Review Case <ArrowRight className="w-3 h-3" /></span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Applicant */}
                <div>
                  <h3 className="text-xs font-semibold text-fast-muted uppercase mb-3">Applicant Details</h3>
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <span className="text-xs text-fast-muted w-28">Full Name</span>
                      <span className="text-sm font-medium text-fast-text">{c.applicantName}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs text-fast-muted w-28">Application Type</span>
                      <span className="text-sm text-fast-text">{c.applicationType}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-fast-muted w-28">Assigned To</span>
                      <span className="text-sm text-fast-text">{c.assignedToName || 'Unassigned'}</span>
                      {c.assignedToName && (
                        <button
                          onClick={() => handleUnassign(c.id)}
                          disabled={unassigningId === c.id}
                          className="inline-flex items-center gap-1 text-2xs text-fast-muted hover:text-fast-declined font-medium px-1.5 py-0.5 rounded border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <UserMinus className="w-3 h-3" />
                          {unassigningId === c.id ? '...' : 'Unassign'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Escalation */}
                <div>
                  <h3 className="text-xs font-semibold text-fast-muted uppercase mb-3">Escalation Details</h3>
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <span className="text-xs text-fast-muted w-28">Escalated On</span>
                      <span className="text-sm text-fast-text">
                        {new Date(c.updatedAt).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs text-fast-muted w-28">AI Confidence</span>
                      <span className={`text-sm font-medium ${
                        (c.aiConfidence ?? 0) < 50 ? 'text-fast-declined' : 'text-fast-escalated'
                      }`}>
                        {c.aiConfidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Escalation reason */}
              {c.escalationReason && (
                <div className="mt-4 bg-fast-orange-light rounded p-3">
                  <p className="text-xs font-semibold text-fast-muted uppercase mb-1">Escalation Reason</p>
                  <p className="text-sm text-fast-text">{c.escalationReason}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
