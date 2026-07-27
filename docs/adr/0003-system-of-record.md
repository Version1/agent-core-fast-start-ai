# ADR-0003 — Aurora as system of record; DynamoDB as derived read model

- **Status:** Proposed
- **Date:** 2026-06-23
- **Deciders:** Data / Platform engineering
- **Go-live gate:** Must-have

## Context
Agent code (`terraform/lambda_src/shared/agent_utils.py`) writes case state to **both**
DynamoDB (`case-runtime-state`) and Aurora, with no transaction spanning the two. A
failure between the writes leaves the authoritative record and the runtime view
divergent. For a system that records benefit-eligibility decisions, an ambiguous
source of truth is unacceptable.

## Decision
Designate **Aurora PostgreSQL as the single system of record** for cases, documents,
policy and agent outputs. **DynamoDB becomes a derived read model**, projected from
Aurora rather than written directly by application code:

- Application writes go to Aurora only (via RDS Data API).
- A change-data path (**DynamoDB Streams / Lambda projector**, or Aurora → projector)
  maintains the read-optimised DynamoDB view used for fast status lookups and the
  caseworker UI.
- The projection is idempotent and replayable.

## Consequences
**Positive:** unambiguous record of truth; no dual-write divergence; clean audit
lineage; read model can be rebuilt from Aurora.
**Negative:** introduces eventual consistency between Aurora and the read model (must
be surfaced in UX); requires a projector component and backfill tooling.

## Alternatives considered
- *Keep dual-write with a transactional outbox in Aurora:* acceptable variant; still
  makes Aurora the source of truth — folded into this decision as the write path.
- *DynamoDB as source of truth:* weaker relational/audit/query story for case data.

## Affected components
`lambda_src/shared/agent_utils.py`, `modules/dynamodb`, `modules/aurora`, new projector.
