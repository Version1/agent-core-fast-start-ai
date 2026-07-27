# ADR-0009 — Multi-region DR with defined RTO/RPO

- **Status:** Proposed
- **Date:** 2026-06-23
- **Deciders:** Platform / Business continuity
- **Go-live gate:** Fast-follow (launch risk if unmet must be formally accepted)

## Context
The platform is single-region (`eu-west-2`). Aurora runs a single instance
(`modules/aurora` creates one `aws_rds_cluster_instance`), S3 has no cross-region
replication, and there is no documented recovery objective. A regional impairment
would currently be an extended, unbounded outage with potential data loss.

## Decision
Define **RTO/RPO targets with the business**, then design to them:

- **Aurora:** add a Multi-AZ reader for in-region HA now; cross-region automated
  snapshots (or Aurora Global Database if RTO is tight) for DR.
- **S3:** Cross-Region Replication for the documents and audit buckets.
- **DynamoDB read model:** PITR (already on) plus rebuild-from-Aurora capability; global
  tables only if the read model must survive regional loss independently.
- **EventBridge** archive/replay (already present) supports event re-drive.
- A **documented, tested DR runbook** and periodic game-days.

## Consequences
**Positive:** bounded, tested recovery; eliminates the single-instance SPOF.
**Negative:** cross-region replication and standby cost; failover orchestration
complexity; data-residency must keep replicas within approved (EU) regions.

## Alternatives considered
- *Backup-only, single region:* lowest cost, weakest RTO — acceptable only if the
  business explicitly accepts the recovery window.
- *Active-active multi-region:* highest resilience and cost; unnecessary for current
  load.

## Affected components
`modules/aurora`, `modules/s3`, `modules/dynamodb`, new DR/backup module, runbooks.
