# ADR-0004 — Idempotency keys for agent processing

- **Status:** Proposed
- **Date:** 2026-06-23
- **Deciders:** Platform engineering
- **Go-live gate:** Must-have

## Context
The pipeline uses SQS (at-least-once delivery) with `maxReceiveCount = 3` redrive
(`terraform/modules/sqs/main.tf`) and Step Functions retries. The agent Lambdas call
**Amazon Bedrock**, which is expensive and non-idempotent. Without dedupe, a redelivered
or retried message can invoke a model twice and write a second decision/audit row —
inflating cost and corrupting the record.

## Decision
Introduce an **idempotency key per `(caseId, stage, attempt-scope)`**:

- A dedicated DynamoDB idempotency table (TTL'd) with a conditional `PutItem` claims
  the key before any side-effecting work.
- Bedrock invocation and persistence are guarded by the claim; on a duplicate the
  handler returns the prior result instead of re-running.
- Pairs with [ADR-0002](0002-step-functions-callback.md): the task-token callback is
  sent exactly once per logical completion.

## Consequences
**Positive:** at-most-once side effects; predictable Bedrock cost; clean audit trail;
safe retries and DLQ redrive.
**Negative:** extra table + read/write on the hot path; handlers must wrap all side
effects behind the claim.

## Alternatives considered
- *Conditional writes on the case row only:* covers persistence but not the (costly)
  model call.
- *FIFO SQS with content dedupe:* 5-minute dedupe window only; insufficient for
  multi-stage, long-running processing.

## Affected components
All agent handlers, `modules/dynamodb` (new idempotency table), `modules/iam`.
