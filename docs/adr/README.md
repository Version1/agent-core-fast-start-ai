# Architecture Decision Records — Case Triage Management System

These ADRs capture the design decisions required to take the Case Triage platform
from its current (as-is) build to a production-ready target state. Each record is
self-contained and uses a lightweight [MADR](https://adr.github.io/madr/) format.

Pairs with:
- `TO-BE-ARCHITECTURE.html` — target-state diagram (NEW/CHG deltas)
- `Case-Triage-Production-Readiness-Roadmap.docx` — phased delivery plan

## Status legend
`Proposed` → under review · `Accepted` → agreed for build · `Superseded` → replaced.

## Index

| ADR | Title | Status | Go-live gate |
|-----|-------|--------|--------------|
| [0001](0001-account-per-environment.md) | Account-per-environment topology with OIDC pipeline | Proposed | Must-have |
| [0002](0002-step-functions-callback.md) | Replace Step Functions polling with task-token callback | Proposed | Must-have |
| [0003](0003-system-of-record.md) | Aurora as system of record; DynamoDB as derived read model | Proposed | Must-have |
| [0004](0004-idempotency.md) | Idempotency keys for agent processing | Proposed | Must-have |
| [0005](0005-tenant-isolation.md) | Tenant isolation via org-scoped RBAC and Aurora RLS | Proposed | Must-have |
| [0006](0006-ai-governance.md) | AI decision governance (Guardrails, model versioning, HITL) | Proposed | Must-have |
| [0007](0007-edge-security.md) | Edge security: CloudFront + WAF + Shield | Proposed | Must-have |
| [0008](0008-customer-managed-kms.md) | Customer-managed KMS for all data stores | Proposed | Must-have |
| [0009](0009-multi-region-dr.md) | Multi-region DR with defined RTO/RPO | Proposed | Fast-follow |
| [0010](0010-deployment-safety.md) | Deployment safety: versioned Lambda, canary, migrations | Proposed | Must-have |
