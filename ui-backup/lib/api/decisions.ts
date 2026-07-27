/**
 * Decisions API – record decision for a case via POST /cases/{caseId}/decision.
 */

import { apiClient } from './client';

export type RecordDecisionBody = {
  decision: 'approve' | 'decline' | 'escalate';
  justification: string;
};

export async function recordDecision(
  caseId: string,
  body: RecordDecisionBody
): Promise<{ caseId: string; status: string; decidedAt: string }> {
  const { data } = await apiClient.post<{ caseId: string; status: string; decidedAt: string }>(
    `/cases/${caseId}/decision`,
    body,
  );
  return data;
}
