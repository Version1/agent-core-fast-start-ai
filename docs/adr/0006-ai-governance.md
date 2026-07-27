# ADR-0006 — AI decision governance (Guardrails, model versioning, HITL)

- **Status:** Proposed
- **Date:** 2026-06-23
- **Deciders:** Product / Risk / Engineering
- **Go-live gate:** Must-have

## Context
The agents assess **benefit eligibility from claimants' ID and bank statements** using
Amazon Bedrock. The model id is hardcoded and inconsistent across the codebase
(`modules/lambda/main.tf` pins `anthropic.claude-3-7-sonnet-...` while
`case_summary/handler.py` defaults to `claude-sonnet-4-6`). There is no PII guardrail,
no model-change evaluation, and no recorded confidence/threshold driving human review.
Automated decisions affecting individuals' benefits carry legal and ethical obligations
(UK public-sector accountability, GDPR Art. 22 on automated decision-making).

## Decision
Establish an **AI governance design**:

- **Amazon Bedrock Guardrails** to redact/deny PII in prompts and constrain outputs;
  confirm all inference stays in-region (scope `bedrock:InvokeModel` to specific
  in-region model ARNs — see [ADR-0008]).
- **Single governed model reference** (one variable / cross-region inference profile),
  versioned and changed only through an **evaluation harness** (golden-set regression).
- **Confidence thresholds**: low-confidence outputs are flagged and **always routed to
  mandatory human review** — the caseworker remains the accountable decision-maker.
- **Explainability + audit**: persist model id, version, prompt hash, and rationale per
  decision in the immutable audit store.

## Consequences
**Positive:** defensible, auditable automated assistance; controlled model evolution;
PII-safe prompting; regulatory alignment.
**Negative:** governance process and eval tooling to build/maintain; guardrails add
latency/cost; thresholds need tuning with real data.

## Alternatives considered
- *Ungoverned direct model calls (current):* unacceptable for regulated decisions.
- *Fully automated decisions:* rejected — human-in-the-loop is required.

## Affected components
All agent handlers, `modules/lambda` (model config), `modules/iam` (Bedrock scope),
audit store.
