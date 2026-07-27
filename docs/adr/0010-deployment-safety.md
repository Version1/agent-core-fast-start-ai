# ADR-0010 — Deployment safety: versioned Lambda, canary, migrations

- **Status:** Proposed
- **Date:** 2026-06-23
- **Deciders:** Platform engineering
- **Go-live gate:** Must-have

## Context
Functions deploy as `$LATEST` with no aliases or gradual rollout (`modules/lambda`).
The root module forces an API redeploy on every apply via
`null_resource.final_stage_deploy` with `triggers = { always = timestamp() }`, and
database schema is created by a one-shot `schema_init` Lambda invoked through a bash
`local-exec` block (`main.tf`) that depends on `/tmp` and the AWS CLI — it will not run
on a clean Windows or container CI runner. There is no automated rollback.

## Decision
Adopt a safe, repeatable release design:

- **Versioned Lambdas + aliases** with **CodeDeploy canary** (e.g. 10% / 10 min) and
  CloudWatch-alarm-triggered automatic rollback.
- Replace imperative `null_resource` / `local-exec` with **native Terraform**
  (`aws_api_gateway_deployment` trigger hash; `aws_lambda_invocation` where invocation
  is genuinely needed). `terraform apply` must be idempotent.
- Replace `schema_init` with a **versioned migration tool** (Flyway / Alembic /
  sqlc-migrate) run as a pipeline step, with forward-only, reviewed migrations.
- Deploy exclusively through the [ADR-0001] OIDC pipeline.

## Consequences
**Positive:** progressive delivery with automatic rollback, idempotent infra, portable
CI, auditable schema evolution.
**Negative:** alias/version wiring and migration tooling to introduce; pipeline build
effort.

## Alternatives considered
- *All-at-once deploys (current):* no blast-radius control or rollback — rejected.
- *Keep one-shot schema Lambda:* not portable or versioned — rejected.

## Affected components
`modules/lambda`, `modules/api_gateway`, root `main.tf`, `lambda_src/schema_init`, pipeline.
