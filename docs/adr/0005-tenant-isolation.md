# ADR-0005 — Tenant isolation via org-scoped RBAC and Aurora RLS

- **Status:** Proposed
- **Date:** 2026-06-23
- **Deciders:** Security / Platform engineering
- **Go-live gate:** Must-have

## Context
Cases carry an `orgId` (see `application_init/handler.py`) and the system serves
multiple organisations, but isolation is not enforced in the data tier — the API
Lambdas query by parameters and the DynamoDB GSIs include `orgId-status-index`, yet
nothing guarantees a caseworker cannot read another org's cases. For PII benefit data
this is a confidentiality and regulatory risk.

## Decision
Enforce **tenant isolation at every layer**, not just the UI:

- **Cognito** carries the user's `orgId` (and role) as a verified claim/group
  ([ADR-0007] edge passes it through); the API authorizer rejects mismatches.
- **Aurora Row-Level Security (RLS)** policies scope every query to the caller's
  `orgId`, set via a session/connection parameter — defence in depth even if app code
  forgets a filter.
- The DynamoDB read model is queried only through `orgId`-partitioned access patterns.

## Consequences
**Positive:** structural confidentiality guarantee; passes least-privilege and
data-segregation audit; reduces impact of an application bug.
**Negative:** RLS adds query design constraints and testing; the RDS Data API call
path must reliably set the tenant context per request.

## Alternatives considered
- *Application-only filtering:* one missing `WHERE` clause leaks data — rejected.
- *Database-per-tenant:* strongest isolation but operationally heavy at this scale.

## Affected components
`modules/cognito`, `modules/api_cases`, API Lambdas, Aurora schema (`schema_init`).
