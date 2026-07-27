# ADR-0002 — Replace Step Functions polling with task-token callback

- **Status:** Proposed
- **Date:** 2026-06-23
- **Deciders:** Platform engineering
- **Go-live gate:** Must-have

## Context
The orchestration in `terraform/modules/step_functions/main.tf` advances each stage
by **polling**: `Wait 15s → dynamodb:GetItem → Choice → loop` (and `Wait 30s` for
extraction). The agent Lambdas, however, run asynchronously off an SQS event-source
mapping (`terraform/modules/lambda/main.tf`). The state machine and the worker are
therefore decoupled and reconciled only by polling, which causes:

- a fixed latency floor (15–30s per stage regardless of actual completion);
- billed state transitions on every poll iteration;
- a read-during-write race on `case-runtime-state` status.

## Decision
Use the **callback pattern** `arn:aws:states:::sqs:sendMessage.waitForTaskToken`.
Step Functions sends the task token in the SQS message body; each agent completes by
calling `SendTaskSuccess` / `SendTaskFailure` (or `SendTaskHeartbeat` for long runs).
The `Wait`/`GetItem`/`Choice` polling loops are removed.

## Consequences
**Positive:** completion-accurate (no latency floor), fewer state transitions (lower
cost), eliminates the status race, native timeout/heartbeat handling.
**Negative:** agents must propagate the token and guarantee a terminal callback on
all paths (including failures) — pairs with [ADR-0004](0004-idempotency.md) so retried
deliveries don't double-complete. Requires `states:SendTaskSuccess/Failure` IAM.

## Alternatives considered
- *EventBridge stage-completion events back to SFN:* viable but more moving parts.
- *Keep polling, shorten waits:* increases cost, doesn't fix the race.

## Affected components
`modules/step_functions`, agent handlers (`tech_validation`, `data_extraction`,
`policy_evaluation`, `case_summary`), `modules/iam`.
