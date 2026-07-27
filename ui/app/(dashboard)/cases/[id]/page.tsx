'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Clock, ArrowRightCircle, ClipboardList, FileText, Eye, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCaseDetail } from '@/hooks/useCaseDetail';
import { addCaseNote } from '@/lib/api';
import { StatusChip } from '@/components/ui';
import { DecisionPanel, DocumentPreviewModal } from '@/components/cases';
import { useAuth } from '@/contexts/AuthContext';
import type { CaseDocument } from '@/types';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;

  const queryClient = useQueryClient();
  const [previewDoc, setPreviewDoc] = useState<CaseDocument | null>(null);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const { data: apiCaseData, isLoading } = useCaseDetail(id);
  const caseData = apiCaseData
    ? {
        ...apiCaseData,
        id: apiCaseData.caseId || id,
      }
    : null;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12 text-fast-muted text-sm">Loading case...</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-6">
        <Link href="/cases" className="inline-flex items-center gap-1.5 text-fast-teal hover:underline mb-4 text-sm">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Cases
        </Link>
        <div className="bg-fast-panel rounded-card border border-gray-200 p-10 text-center">
          <p className="text-fast-muted text-sm">Case <strong>{id}</strong> was not found.</p>
          <button
            onClick={() => router.push('/cases')}
            className="mt-4 px-4 py-2 bg-fast-teal text-white rounded text-sm font-medium hover:bg-fast-teal/90 transition-colors"
          >
            Return to Case List
          </button>
        </div>
      </div>
    );
  }

  const isEscalated = caseData.status === 'ESCALATED';
  const isDecided   = caseData.status === 'APPROVED' || caseData.status === 'DECLINED';
  const isReviewable = caseData.status === 'READY_FOR_CASEWORKER_REVIEW' || caseData.status === 'PENDING' || caseData.status === 'IN_PROGRESS';

  const statusPanelStyles: Record<string, { container: string; iconBg: string; icon: React.ReactNode }> = {
    APPROVED:  { container: 'bg-fast-green-light border-fast-approved', iconBg: 'bg-fast-approved', icon: <CheckCircle2 className="w-5 h-5 text-white" /> },
    DECLINED:  { container: 'bg-fast-red-light border-fast-declined',   iconBg: 'bg-fast-declined', icon: <XCircle className="w-5 h-5 text-white" /> },
    ESCALATED: { container: 'bg-fast-orange-light border-fast-escalated', iconBg: 'bg-fast-escalated', icon: <AlertTriangle className="w-5 h-5 text-white" /> },
    PENDING:   { container: 'bg-amber-50 border-amber-300',            iconBg: 'bg-amber-400',     icon: <Clock className="w-5 h-5 text-white" /> },
    IN_PROGRESS: { container: 'bg-fast-teal-light border-fast-teal',   iconBg: 'bg-fast-teal',     icon: <ArrowRightCircle className="w-5 h-5 text-white" /> },
    READY_FOR_CASEWORKER_REVIEW: { container: 'bg-blue-50 border-blue-400', iconBg: 'bg-blue-500', icon: <ClipboardList className="w-5 h-5 text-white" /> },
  };

  const panel = statusPanelStyles[caseData.status] ?? statusPanelStyles['PENDING'];

  return (
    <div className="p-6 max-w-7xl">
      {/* Back link */}
      <Link
        href={isEscalated ? '/escalated' : '/cases'}
        className="inline-flex items-center gap-1.5 text-fast-teal hover:underline mb-4 text-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to {isEscalated ? 'Escalated Cases' : 'Cases'}
      </Link>

      {/* Case header */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-fast-text">{caseData.id}</h1>
        <StatusChip status={caseData.status} size="md" />
        <StatusChip status={caseData.priority} size="sm" />
      </div>

      {/* AI recommendation outcome */}
      {caseData.aiRecommendation && (
        <div className="mb-6 rounded-card border border-fast-teal/30 bg-fast-teal/5 p-4 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            caseData.aiRecommendation === 'APPROVE' ? 'bg-fast-approved' : 'bg-fast-declined'
          }`}>
            {caseData.aiRecommendation === 'APPROVE'
              ? <CheckCircle2 className="w-5 h-5 text-white" />
              : <XCircle className="w-5 h-5 text-white" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-fast-muted uppercase tracking-wide">AI Recommendation</p>
            <p className="text-base font-semibold text-fast-text mt-0.5">
              Outcome: {caseData.aiRecommendation}
              {caseData.aiConfidence != null && (
                <span className="ml-2 text-sm font-normal text-fast-muted">({caseData.aiConfidence}% confidence)</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Status banner */}
      <div className={`mb-6 border rounded-card p-4 flex items-center gap-4 ${panel.container}`}>
        <div className={`w-9 h-9 ${panel.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
          {panel.icon}
        </div>
        <div>
          <p className="font-medium text-fast-text text-sm">
            Case Status: {caseData.status.replace('_', ' ')}
          </p>
          {isEscalated && caseData.escalationReason && (
            <p className="text-sm text-fast-muted mt-0.5">
              Escalation Reason: {caseData.escalationReason}
            </p>
          )}
          {isDecided && (
            <p className="text-sm text-fast-muted mt-0.5">
              This case has been {caseData.status.toLowerCase()}. No further action required.
            </p>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Information */}
          <section className="bg-fast-panel rounded-card border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-fast-text mb-4">Applicant Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Full Name"        value={caseData.applicantName} />
              <InfoField label="NI Number"        value={caseData.niNumber ? maskNI(caseData.niNumber) : '--'} />
              <InfoField label="Date of Birth"    value={caseData.dob ? formatDob(caseData.dob) : '--'} />
              <InfoField label="Email"            value={caseData.applicantEmail} />
              <InfoField label="Phone"            value={caseData.phone ?? '--'} />
              <InfoField label="Application Type" value={caseData.applicationType} />
              <InfoField
                label="Assigned To"
                value={
                  caseData.assignedToName
                    ? caseData.assignedTo === user?.id
                      ? `${caseData.assignedToName} (you)`
                      : caseData.assignedToName
                    : 'Unassigned'
                }
              />
              <InfoField label="Date Submitted"   value={formatDate(caseData.submittedAt || caseData.createdAt)} />
            </div>
          </section>

          {/* Documents */}
          <section className="bg-fast-panel rounded-card border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-fast-text mb-4">Documents</h2>
            <div className="space-y-2">
              {(caseData.documents ?? []).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100 gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-fast-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-fast-text block truncate">{doc.name}</span>
                      <span className="text-2xs text-fast-muted">
                        {doc.type} &middot; {new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-2xs text-fast-approved font-medium bg-fast-green-light px-2 py-0.5 rounded-full border border-fast-teal/10">
                      Submitted
                    </span>
                    {doc.viewUrl && (
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-fast-teal hover:underline px-2 py-1 rounded border border-fast-teal/30 hover:bg-fast-teal/5 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI Analysis */}
          <section className="bg-fast-panel rounded-card border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold text-fast-text">AI Analysis</h2>
              <span className="text-2xs bg-fast-teal-light text-fast-teal px-2 py-0.5 rounded-full font-medium border border-fast-teal/10">AI Generated</span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-fast-muted uppercase tracking-wide mb-1">Summary</p>
                <p className="text-sm text-fast-text whitespace-pre-line leading-relaxed">
                  {caseData.aiSummary
                    ? caseData.aiSummary
                    : `Applicant ${caseData.applicantName} has submitted a ${caseData.applicationType} claim. ${
                        caseData.aiConfidence !== undefined ? `AI confidence score: ${caseData.aiConfidence}%.` : ''
                      }`}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-fast-muted uppercase tracking-wide mb-1">Recommendation</p>
                {caseData.aiRecommendation ? (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white ${
                    caseData.aiRecommendation === 'APPROVE' ? 'bg-fast-approved' : 'bg-fast-declined'
                  }`}>
                    {caseData.aiRecommendation}
                  </span>
                ) : (
                  <span className="text-sm text-fast-muted">Not available</span>
                )}
              </div>
              {caseData.extractedData && Object.keys(caseData.extractedData).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-fast-muted uppercase tracking-wide mb-2">Extracted Data</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(caseData.extractedData).map(([key, val]) => (
                      <div key={key} className="p-2.5 bg-gray-50 rounded border border-gray-100">
                        <span className="text-2xs text-fast-muted uppercase">{key.replace(/_/g, ' ')}</span>
                        <p className="text-sm font-medium text-fast-text mt-0.5">{val != null ? String(val) : '--'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-fast-muted uppercase tracking-wide mb-2">Rule Evaluations</p>
                <div className="space-y-2">
                  {(caseData.ruleEvaluations && caseData.ruleEvaluations.length > 0) ? (
                    caseData.ruleEvaluations.map((item, idx) => (
                      <div key={item.ruleId || idx} className="p-2.5 rounded border border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-fast-text font-medium">
                            {item.rule || item.ruleId || `Rule ${idx + 1}`}
                          </span>
                          <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                            item.passed ? 'bg-fast-green-light text-fast-approved border border-fast-teal/10' :
                            item.status === 'INCONCLUSIVE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-fast-red-light text-fast-declined border border-red-200'
                          }`}>
                            {item.status || (item.passed ? 'PASS' : 'FAIL')}
                          </span>
                        </div>
                        {item.reason && (
                          <p className="text-xs text-fast-muted mt-1">{item.reason}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-fast-muted">No rule evaluations available yet.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="bg-fast-panel rounded-card border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-fast-text mb-3">Caseworker Notes</h2>

            {(caseData.notes && caseData.notes.length > 0) ? (
              <div className="space-y-3 mb-4">
                {[...caseData.notes].reverse().map((n, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded border border-gray-100">
                    <p className="text-sm text-fast-text whitespace-pre-line">{n.text}</p>
                    <p className="text-2xs text-fast-muted mt-1.5">
                      {n.author} &mdash; {n.timestamp ? formatDateTime(n.timestamp) : '--'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-fast-muted mb-4">No notes yet.</p>
            )}

            <div className="border-t border-gray-100 pt-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-fast-text placeholder:text-fast-muted focus:outline-none focus:ring-1 focus:ring-fast-teal/30 focus:border-fast-teal resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={async () => {
                    if (!newNote.trim()) return;
                    setSavingNote(true);
                    try {
                      await addCaseNote(caseData.id, newNote.trim(), user?.name ?? 'Unknown');
                      await queryClient.invalidateQueries({ queryKey: ['case', id] });
                      setNewNote('');
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : 'Unknown error';
                      alert(`Failed to add note: ${msg}`);
                    } finally {
                      setSavingNote(false);
                    }
                  }}
                  disabled={savingNote || !newNote.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-fast-teal text-white rounded text-xs font-medium hover:bg-fast-teal/90 transition-colors disabled:opacity-40"
                >
                  <Save className="w-3 h-3" />
                  {savingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </div>
          </section>

          {/* Activity History */}
          <section className="bg-fast-panel rounded-card border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-fast-text mb-4">Activity History</h2>
            <ol className="relative border-l-2 border-gray-200 ml-2 space-y-4">
              {(caseData.activityHistory && caseData.activityHistory.length > 0) ? (
                caseData.activityHistory.map((entry, i) => (
                  <li key={i} className="ml-4">
                    <div className="absolute -left-[5px] mt-1.5 w-2 h-2 rounded-full bg-fast-teal" />
                    <p className="text-sm font-medium text-fast-text">{entry.action}</p>
                    <p className="text-xs text-fast-muted">
                      {entry.eventAt ? formatDateTime(entry.eventAt) : '--'} &mdash; {entry.agent || 'System'}
                    </p>
                  </li>
                ))
              ) : (
                <li className="ml-4">
                  <div className="absolute -left-[5px] mt-1.5 w-2 h-2 rounded-full bg-fast-teal" />
                  <p className="text-sm font-medium text-fast-text">Application Submitted</p>
                  <p className="text-xs text-fast-muted">{formatDateTime(caseData.submittedAt || caseData.createdAt)} &mdash; Applicant</p>
                </li>
              )}
            </ol>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* AI Confidence */}
          <div className="bg-fast-panel rounded-card border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-fast-text mb-4">AI Confidence</h2>
            <div className="text-center mb-3">
              <p className="text-3xl font-semibold tabular-nums" style={{
                color: (caseData.aiConfidence ?? 0) >= 70 ? '#003A46' :
                       (caseData.aiConfidence ?? 0) >= 50 ? '#003A46' : '#f44336'
              }}>
                {caseData.aiConfidence ?? '--'}%
              </p>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width:  `${caseData.aiConfidence ?? 0}%`,
                  backgroundColor:
                    (caseData.aiConfidence ?? 0) >= 70 ? '#003A46' :
                    (caseData.aiConfidence ?? 0) >= 50 ? '#003A46' : '#f44336',
                }}
              />
            </div>
            <p className="text-xs text-fast-muted mt-2 text-center">
              {(caseData.aiConfidence ?? 0) >= 70 ? 'High confidence' :
               (caseData.aiConfidence ?? 0) >= 50 ? 'Moderate confidence' : 'Low confidence -- review carefully'}
            </p>
          </div>

          {(isReviewable || (caseData.status === 'ESCALATED' && user?.role === 'MANAGER')) && (
            <DecisionPanel caseData={caseData} />
          )}

          {(isDecided || (isEscalated && user?.role !== 'MANAGER')) && (
            <div className="bg-fast-panel rounded-card border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-fast-text mb-2">No Further Action</h3>
              <p className="text-sm text-fast-muted">
                This case has a final status of{' '}
                <strong>{caseData.status.replace('_', ' ')}</strong>.
                {isEscalated && user?.role !== 'MANAGER' && ' A manager is reviewing this escalation.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xs text-fast-muted uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-medium text-fast-text">{value}</p>
    </div>
  );
}

function maskNI(ni: string) {
  const clean = ni.replace(/\s/g, '');
  return clean.slice(0, 2) + '****' + clean.slice(-2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

function formatDob(dob: string) {
  return new Date(dob).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}
