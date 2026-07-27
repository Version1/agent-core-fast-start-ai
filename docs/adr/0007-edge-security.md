# ADR-0007 — Edge security: CloudFront + WAF + Shield

- **Status:** Proposed
- **Date:** 2026-06-23
- **Deciders:** Security engineering
- **Go-live gate:** Must-have

## Context
The REST API (`modules/api_gateway`) is `REGIONAL` and currently exposes the intake
routes with `authorization = NONE` (`enable_cognito_auth = false` in root `main.tf`),
and there is no web-application firewall, CDN, or DDoS protection in front of either
the API or the Amplify portal. Method-level throttling exists (burst 50 / rate 100) but
that is not a substitute for L7 protection on an internet-facing PII service.

## Decision
Introduce a hardened edge:

- **CloudFront** in front of the portal and API (TLS termination, caching, single
  ingress).
- **AWS WAF** web ACL with managed OWASP rules, IP/-tenant rate limiting, and bot
  control, attached at the edge.
- **AWS Shield** for DDoS protection (Advanced for prod if warranted).
- All intake routes require authentication ([ADR-0005] tenant claim enforced).
- Restrict S3 CORS from `*` to the CloudFront/portal origin.

## Consequences
**Positive:** standard L7 defence, abuse rate-limiting, reduced direct origin
exposure, single audited ingress.
**Negative:** added latency/cost; WAF rule tuning to avoid false positives; cache
behaviour must respect auth.

## Alternatives considered
- *API Gateway throttling only:* no L7/DDoS/bot protection — insufficient.
- *WAF on API Gateway without CloudFront:* misses portal and global edge benefits.

## Affected components
New edge module, `modules/api_gateway`, `modules/amplify`, `modules/s3` (CORS).
