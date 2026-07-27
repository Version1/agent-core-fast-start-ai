# ADR-0008 — Customer-managed KMS for all data stores

- **Status:** Proposed
- **Date:** 2026-06-23
- **Deciders:** Security engineering
- **Go-live gate:** Must-have

## Context
Encryption today is enabled but inconsistent and mostly on AWS-owned/managed keys:
S3 documents use the default `aws:kms`, the audit-logs bucket uses `AES256`
(`modules/s3`), SQS uses `alias/aws/sqs` (`modules/sqs`), DynamoDB SSE uses the
AWS-owned key (`modules/dynamodb`), and Aurora uses the default RDS key
(`modules/aurora`). This prevents unified key auditing, a cross-service revocation
control, and customer-controlled rotation — all expected for a PII workload.

## Decision
Provision **customer-managed KMS keys (CMKs)** with automatic rotation and explicit
key policies, applied across **S3 (both buckets), SQS, DynamoDB tables, and Aurora
storage**. Key policies grant only the specific service roles
([ADR is complemented by IAM role split]). Consider per-domain keys (documents vs
audit) for separation of duties.

## Consequences
**Positive:** unified encryption audit, customer-controlled rotation, a revocation
kill-switch, regulatory alignment.
**Negative:** key administration overhead; **Aurora storage-key change requires
snapshot-and-restore** (schedule in a maintenance window); small per-request KMS cost.

## Alternatives considered
- *Keep AWS-managed keys:* simplest but no customer control/audit — rejected for PII.
- *Single CMK for everything:* acceptable; per-domain keys preferred for blast radius.

## Affected components
`modules/s3`, `modules/sqs`, `modules/dynamodb`, `modules/aurora`, `modules/iam`.
