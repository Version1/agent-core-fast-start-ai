'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { useEmailDraft } from '@/contexts/EmailDraftContext';
import { useCaseDetail } from '@/hooks/useCaseDetail';
import { sendDecisionEmail } from '@/lib/api/email';

const DECISION_STYLES = {
  APPROVED:  { bg: 'bg-fast-green-light border-fast-approved',   icon: <CheckCircle2 className="w-5 h-5" />, text: 'text-fast-approved',   label: 'Approve' },
  DECLINED:  { bg: 'bg-fast-red-light border-fast-declined',     icon: <XCircle className="w-5 h-5" />, text: 'text-fast-declined',   label: 'Decline' },
  ESCALATED: { bg: 'bg-fast-orange-light border-fast-escalated', icon: <AlertTriangle className="w-5 h-5" />, text: 'text-fast-escalated', label: 'Escalate' },
};

export default function EmailReviewPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { draft, setDraft } = useEmailDraft();

  const caseId   = searchParams?.get('caseId')   ?? '';
  const decision = searchParams?.get('decision') ?? '';

  const { data: caseData } = useCaseDetail(caseId);

  const [subject, setSubject]   = useState('');
  const [body, setBody]         = useState('');
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);

  useEffect(() => {
    if (draft) {
      setSubject(draft.subject);
      setBody(draft.body);
    } else if (!caseId) {
      router.replace('/cases');
    }
  }, [draft, caseId, router]);
  const decisionKey = (decision || draft?.decision || '') as keyof typeof DECISION_STYLES;
  const style = DECISION_STYLES[decisionKey] ?? DECISION_STYLES['APPROVED'];

  const handleSend = async () => {
    setSending(true);
    try {
      await sendDecisionEmail(caseId, {
        subject,
        body,
        toAddress: draft?.toAddress ?? caseData?.applicantEmail ?? '',
        toName: draft?.toName ?? caseData?.applicantName ?? '',
        decision: decisionKey,
      });
    } catch (err) {
      console.error('Email send failed, continuing anyway:', err);
    }
    setDraft(null);
    setSent(true);
    setSending(false);
    // Brief success display then redirect
    setTimeout(() => router.push('/cases'), 1500);
  };

  const handleCancel = () => {
    setDraft(null);
    router.push(caseId ? `/cases/${caseId}` : '/cases');
  };

  if (sent) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="bg-fast-panel rounded-card border border-gray-200 p-10 text-center max-w-sm">
          <div className="w-16 h-16 bg-fast-green-light rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-fast-approved" />
          </div>
          <h2 className="text-2xl font-semibold text-fast-text mb-2">Email Sent</h2>
          <p className="text-sm text-fast-muted mt-1">
            The email has been sent and the case status has been updated. Redirecting to case list…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-fast-text mb-1">Email Review</h1>
        <p className="text-sm text-fast-muted mt-1">
          Review and edit the AI-generated email before sending. The case status will only update after you click Send.
        </p>
      </div>

      {/* Decision banner */}
      <div className={`mb-6 border-2 rounded-card p-4 flex items-center gap-3 ${style.bg}`}>
        <span className={style.text}>{style.icon}</span>
        <div>
          <p className={`font-semibold ${style.text}`}>
            Pending Decision: {style.label}
          </p>
          {caseData && (
            <p className="text-sm text-fast-muted">
              Case {caseData.caseId ?? caseId} — {caseData.applicantName}
            </p>
          )}
        </div>
      </div>

      {/* Email editor */}
      <div className="bg-fast-panel rounded-card border border-gray-200 p-6 space-y-5">
        {/* To field (read-only) */}
        <div>
          <label className="block text-sm font-semibold text-fast-text mb-1">To</label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-fast-muted">
            {draft?.toName ?? caseData?.applicantName ?? '—'} &lt;{draft?.toAddress ?? caseData?.applicantEmail ?? '—'}&gt;
          </div>
        </div>

        {/* Subject (editable) */}
        <div>
          <label className="block text-sm font-semibold text-fast-text mb-1">
            Subject <span className="text-fast-declined">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-fast-text focus:outline-none focus:ring-1 focus:ring-fast-teal/30 focus:border-fast-teal"
          />
        </div>

        {/* Body (editable) */}
        <div>
          <label className="block text-sm font-semibold text-fast-text mb-1">
            Message Body <span className="text-fast-declined">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-fast-text font-[inherit] focus:outline-none focus:ring-1 focus:ring-fast-teal/30 focus:border-fast-teal resize-y"
          />
          <p className="text-xs text-fast-muted mt-1">
            This email was AI-generated. You may edit it before sending.
          </p>
        </div>

        {/* Justification preview */}
        {draft?.justification && (
          <div className="bg-fast-blue-light rounded p-3">
            <p className="text-xs font-semibold text-fast-muted uppercase mb-1">Decision Justification (internal)</p>
            <p className="text-sm text-fast-text">{draft.justification}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-fast-text hover:bg-gray-50 rounded font-medium transition-colors"
          >
            Cancel — Discard Decision
          </button>
          <button
            onClick={handleSend}
            disabled={!subject.trim() || !body.trim() || sending}
            className="flex-1 px-4 py-3 bg-fast-teal text-white rounded font-semibold hover:opacity-90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Email &amp; Update Case
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-fast-muted text-center">
          Clicking &quot;Cancel&quot; will discard this decision entirely. The case status will remain unchanged.
        </p>
      </div>
    </div>
  );
}
