# ADR-0001 — Account-per-environment topology with OIDC pipeline

- **Status:** Proposed
- **Date:** 2026-06-23
- **Deciders:** Platform / Cloud engineering
- **Go-live gate:** Must-have

## Context
The current build treats `environment` as a Terraform variable and uses a single,
fixed remote-state key (`casetriage/infra.tfstate` in `terraform/backend.tf`). All
environments would therefore share one AWS account and one state file. Deployment is
driven from a workstation (`terraform/depoy_and_init.sh`, `bulk-import.sh`) with
`local-exec` steps, implying long-lived credentials. For a public-sector system
handling PII this gives insufficient blast-radius isolation, no independent service
quotas, and a non-auditable release path.

## Decision
Adopt an **account-per-environment** topology under AWS Organizations
(`dev`, `staging`, `prod`, plus a shared `cicd`/`security-tooling` account):

- Independent Terraform state per account (separate backend key/bucket).
- Service Control Policies (SCPs) enforcing region (`eu-west-2`), encryption, and
  guardrails at the org level.
- A **CodePipeline/GitHub Actions pipeline** that assumes per-account roles via
  **OIDC** (no static keys), with `plan → manual approval → apply` and promotion of
  the same artifact dev → staging → prod.

## Consequences
**Positive:** strong isolation, per-env quotas/billing, auditable releases, least-
privilege deploy identity, foundation for every other ADR.
**Negative / cost:** more accounts to manage (mitigated by Organizations + landing-
zone automation); pipeline build effort; cross-account IAM complexity.

## Alternatives considered
- *Single account, workspace-per-env:* cheaper but shared blast radius and quotas —
  rejected for a PII production workload.
- *Branch-per-env in one account:* same isolation weakness.

## Affected components
`terraform/backend.tf`, root module, all deploy scripts.
