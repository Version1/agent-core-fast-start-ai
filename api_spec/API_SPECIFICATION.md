# Case Triage Portal — Full API Specification

**Base URL:** `https://tmgcd7i8nd.execute-api.eu-west-2.amazonaws.com/dev`
**Auth:** Cognito JWT Bearer token (unless noted otherwise)
**Content-Type:** `application/json`

---

## Table of Contents

1. [Application Intake](#1-application-intake)
2. [Cases](#2-cases)
3. [Case Actions](#3-case-actions)
4. [Notifications](#4-notifications)
5. [Admin — Users](#5-admin--users)
6. [Admin — Policies](#6-admin--policies)
7. [User Profile](#7-user-profile)
8. [Frontend Usage Matrix](#8-frontend-usage-matrix)
9. [Error Response Format](#9-error-response-format)
10. [Authentication](#10-authentication)
11. [CORS](#11-cors)

---

## 1. Application Intake

### 1.1 POST /applications/init

Initialise a new case application. Returns presigned S3 URLs for document upload.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-application-init`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `caseId` | string | Yes | Client-generated case ID (e.g. `COUNCILA-2026-386435`) |
| `orgId` | string | Yes | Organisation identifier (e.g. `councilA`) |
| `caseType` | string | Yes | One of: `hardship-fund`, `housing-support`, `emergency-grant` |
| `submissionType` | string | Yes | e.g. `NEW` |
| `submittedAt` | string | Yes | ISO 8601 timestamp |
| `applicant` | object | No | Applicant details (firstName, lastName, dob, nationalInsurance, email, phone) |
| `documents-to-upload` | array | No | List of documents with fileName, documentType, version |

**Success Response (200):**

```json
{
  "caseId": "COUNCILA-2026-386435",
  "status": "AWAITING_DOCUMENTS",
  "policyVersion": 1,
  "uploadUrls": {
    "id_proof": "https://s3.presigned.url...",
    "bank_statement_jan": "https://s3.presigned.url...",
    "bank_statement_dec": "https://s3.presigned.url...",
    "bank_statement_nov": "https://s3.presigned.url...",
    "tenancy_agreement": "https://s3.presigned.url..."
  },
  "expiresIn": 900
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "Invalid JSON body"}` |
| 400 | `{"error": "Missing required fields: [...]"}` |
| 400 | `{"error": "Invalid caseType. Must be one of: {...}"}` |
| 409 | `{"error": "Case {caseId} already exists"}` |
| 500 | `{"error": "Failed to initialise case"}` |

---

### 1.2 PUT — S3 Presigned Upload

Upload documents to S3 using presigned URLs returned from `/applications/init`.

**Auth:** None (presigned URL is self-authenticating)
**URL:** Presigned URL from `uploadUrls` field above

**Request:**

| Header | Value |
|--------|-------|
| (none) | Do NOT set Content-Type — presigned URL signature excludes it |

**Body:** Raw binary PDF data

**Success Response:** `200 OK` (empty body)

---

### 1.3 POST /applications/complete

Finalise the application after all documents are uploaded. Triggers the EventBridge/Step Functions processing pipeline.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-application-finalize`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `caseId` | string | Yes | Case ID from init step |

**Success Response (200):**

```json
{
  "caseId": "COUNCILA-2026-386435",
  "status": "INTAKE_VALIDATED",
  "message": "Application received and validated. Processing will begin shortly."
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "Invalid JSON body"}` |
| 400 | `{"error": "caseId is required"}` |
| 404 | `{"error": "Case {caseId} not found"}` |
| 409 | `{"error": "Case is in status '...' — cannot finalise"}` |
| 422 | `{"error": "Missing required documents", "missingDocs": ["doc_type"]}` |
| 500 | `{"error": "Failed to update case status"}` |

---

## 2. Cases

### 2.1 GET /cases

List all cases with optional filtering and pagination.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-list-cases`
**CORS:** Yes

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `status` | string | No | — | Filter by case status |
| `assignedTo` | string | No | — | Filter by assigned caseworker |
| `limit` | int | No | 20 | Page size (max 100) |
| `nextToken` | string | No | — | Pagination token (base64) |

**Success Response (200):**

```json
{
  "cases": [
    {
      "caseId": "COUNCILA-2026-386435",
      "applicantName": "Isla O'Brien",
      "applicationType": "hardship-fund",
      "status": "DOCS_TECHNICALLY_VALIDATED",
      "priority": "medium",
      "assignedTo": "user-id",
      "assignedToName": "Jane Smith",
      "updatedAt": "2026-03-05T16:04:15Z",
      "aiConfidence": 0.85,
      "createdAt": "2026-03-05T16:04:15Z"
    }
  ],
  "nextToken": "base64-encoded-token-or-null"
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "Invalid nextToken"}` |
| 500 | `{"error": "..."}` |

---

### 2.2 GET /cases/{caseId}

Get full case details including documents, extracted data, rule evaluations, and audit trail.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-get-case-detail`
**CORS:** Yes

**Path Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `caseId` | string | Yes |

**Success Response (200):**

```json
{
  "caseId": "COUNCILA-2026-386435",
  "status": "DOCS_TECHNICALLY_VALIDATED",
  "priority": "medium",
  "applicantName": "Isla O'Brien",
  "applicantEmail": "isla.obrien@example.com",
  "applicationType": "hardship-fund",
  "assignedTo": "user-id",
  "assignedToName": "Jane Smith",
  "createdAt": "2026-03-05T16:04:15Z",
  "updatedAt": "2026-03-05T16:04:15Z",
  "submittedAt": "2026-03-05T16:04:15Z",
  "aiConfidence": 0.85,
  "aiRecommendation": "APPROVE",
  "notes": "",
  "documents": [
    {
      "id": "doc-uuid",
      "name": "id_proof.pdf",
      "type": "id_proof",
      "uploadedAt": "2026-03-05T16:04:15Z",
      "viewUrl": "https://s3.presigned.url...",
      "downloadUrl": "https://s3.presigned.url..."
    }
  ],
  "extractedData": {
    "firstName": "Isla",
    "lastName": "O'Brien",
    "monthlyIncome": "1711"
  },
  "ruleEvaluations": [
    {
      "ruleId": "rule-uuid",
      "passed": true,
      "reason": "Income threshold met"
    }
  ],
  "validationResults": [
    {
      "documentType": "id_proof",
      "isValid": true,
      "reason": "Document format valid"
    }
  ],
  "auditTrail": [
    {
      "eventAt": "2026-03-05T16:04:15Z",
      "agent": "tech_validation",
      "action": "VALIDATE",
      "detail": {}
    }
  ]
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "caseId required"}` |
| 404 | `{"error": "Case {caseId} not found"}` |
| 500 | `{"error": "...", "caseId": "..."}` |

---

### 2.3 GET /cases/{caseId}/status

Get case processing status with per-stage breakdown. No Cognito auth required.

**Auth:** None (public)
**Lambda:** `case-triage-dev-get-case-status` (defined in api_cases module)
**CORS:** Yes (headers: `Content-Type, x-api-key`)

**Path Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `caseId` | string | Yes |

**Success Response (200):**

```json
{
  "caseId": "COUNCILA-2026-386435",
  "overallStatus": "DOCS_TECHNICALLY_VALIDATED",
  "priority": "medium",
  "policyStatus": "active",
  "requiresSupervisorReview": false,
  "stages": {
    "intake": { "status": "COMPLETE", "updatedAt": "2026-03-05T16:04:15Z" },
    "agent1": { "status": "COMPLETE", "updatedAt": "2026-03-05T16:04:20Z" },
    "agent2": { "status": "PENDING", "updatedAt": null },
    "agent3": { "status": "PENDING", "updatedAt": null },
    "agent4": { "status": "PENDING", "updatedAt": null },
    "review": { "status": "READY", "updatedAt": null }
  },
  "casePack": {
    "available": false,
    "s3Key": "case-packs/COUNCILA-2026-386435.json"
  }
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "caseId required"}` |
| 404 | `{"error": "Case {caseId} not found"}` |
| 500 | `{"error": "...", "caseId": "..."}` |

---

### 2.4 GET /cases/{caseId}/pack

Retrieve the compiled case pack (AI-generated summary, extracted data, rule evaluations). No Cognito auth required.

**Auth:** None (public)
**Lambda:** `case-triage-dev-get-case-pack` (defined in api_cases module)
**CORS:** Yes (headers: `Content-Type, x-api-key`)

**Path Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `caseId` | string | Yes |

**Success Response (200):**

Case pack JSON from S3 (structure varies by pipeline output), with `caseId` and `_s3Key` injected.

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "caseId path parameter required"}` |
| 404 | `{"error": "Case pack not found — pipeline may still be processing", "caseId": "..."}` |
| 500 | `{"error": "...", "caseId": "..."}` |

---

## 3. Case Actions

### 3.1 POST /cases/{caseId}/decision

Record a caseworker decision (approve, decline, or escalate).

**Auth:** Cognito JWT required (user sub used as `decidedBy`)
**Lambda:** `case-triage-dev-record-decision`
**CORS:** Yes

**Path Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `caseId` | string | Yes |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `decision` | string | Yes | One of: `approve`, `decline`, `escalate` |
| `justification` | string | Yes | Reason for the decision |
| `idempotencyKey` | string | No | Prevents duplicate decisions |

**Success Response (200):**

```json
{
  "caseId": "COUNCILA-2026-386435",
  "status": "APPROVED",
  "decidedAt": "2026-03-05T17:00:00Z"
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "caseId required"}` |
| 400 | `{"error": "Invalid JSON body"}` |
| 400 | `{"error": "decision is required"}` |
| 400 | `{"error": "justification is required"}` |
| 400 | `{"error": "decision must be one of: approve, decline, escalate"}` |
| 500 | `{"error": "...", "caseId": "..."}` |

---

### 3.2 PUT /cases/{caseId}/assign

Assign or reassign a case to a caseworker.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-assign-case`
**CORS:** Yes

**Path Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `caseId` | string | Yes |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `assignedTo` | string | Yes | User ID of the caseworker |
| `assignedToName` | string | Yes | Display name of the caseworker |

**Success Response (200):**

```json
{
  "caseId": "COUNCILA-2026-386435",
  "assignedTo": "user-uuid",
  "assignedToName": "Jane Smith"
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "caseId required"}` |
| 400 | `{"error": "Invalid JSON body"}` |
| 400 | `{"error": "assignedTo is required"}` |
| 400 | `{"error": "assignedToName is required"}` |
| 500 | `{"error": "...", "caseId": "..."}` |

---

### 3.3 POST /cases/{caseId}/email

Send a decision notification email to the applicant via SES.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-send-decision-email`
**CORS:** Yes

**Path Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `caseId` | string | Yes |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | string | Yes | Email subject line |
| `body` | string | Yes | Email body text |
| `toAddress` | string | Yes | Recipient email address |
| `toName` | string | No | Recipient display name |
| `decision` | string | No | Related decision context |

**Success Response (200):**

```json
{
  "message": "Email sent successfully"
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "caseId path parameter required"}` |
| 400 | `{"error": "Invalid JSON body"}` |
| 400 | `{"error": "subject, body, and toAddress are required"}` |
| 500 | `{"error": "..."}` |

---

## 4. Notifications

### 4.1 GET /notifications

Retrieve notifications for the authenticated user.

**Auth:** Cognito JWT required (user sub used as userId)
**Lambda:** `case-triage-dev-get-notifications`
**CORS:** Yes

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `unreadOnly` | string | No | false | `"true"`, `"1"`, or `"yes"` to filter unread |
| `userId` | string | No | — | Fallback if not in JWT claims |

**Success Response (200):**

```json
{
  "notifications": [
    {
      "id": "base64-encoded-key",
      "type": "CASE_ASSIGNED",
      "title": "New case assigned",
      "message": "Case COUNCILA-2026-386435 has been assigned to you",
      "read": false,
      "createdAt": "2026-03-05T16:10:00Z",
      "caseId": "COUNCILA-2026-386435"
    }
  ]
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "userId required (from authorizer or query param userId)"}` |
| 500 | `{"error": "..."}` |

---

### 4.2 PUT /notifications/{notificationId}/read

Mark a single notification as read.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-mark-notification-read`
**CORS:** Yes

**Path Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `notificationId` | string | Yes | Base64-encoded composite key (`userId#createdAt`) |

**Success Response (200):**

```json
{
  "message": "Notification marked as read"
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "notificationId path parameter required"}` |
| 400 | `{"error": "Invalid notificationId format"}` |
| 404 | `{"error": "Notification not found"}` |
| 500 | `{"error": "..."}` |

---

## 5. Admin — Users

### 5.1 GET /admin/users

List all users from the Cognito User Pool.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-list-users`
**CORS:** Yes

**Success Response (200):**

```json
{
  "users": [
    {
      "id": "cognito-sub-uuid",
      "name": "Jane Smith",
      "email": "jane@council.gov.uk",
      "role": "caseworker",
      "status": "ENABLED",
      "department": "Benefits",
      "casesAssigned": 5,
      "lastLogin": "2026-03-05T10:00:00Z",
      "createdAt": "2026-02-01T09:00:00Z"
    }
  ]
}
```

**Errors:**

| Code | Body |
|------|------|
| 500 | `{"error": "..."}` |

---

### 5.2 POST /admin/users

Create a new Cognito user.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-manage-user`
**CORS:** Yes

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `email` | string | Yes | — | User's email address |
| `name` | string | No | — | Display name |
| `role` | string | No | `caseworker` | One of: `admin`, `caseworker`, `manager` |
| `orgId` | string | No | — | Organisation ID |

**Success Response (201):**

```json
{
  "message": "User created successfully",
  "email": "new.user@council.gov.uk"
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "email is required"}` |
| 409 | `{"error": "User already exists"}` |
| 500 | `{"error": "..."}` |

---

### 5.3 PUT /admin/users/{userId}/role

Update a user's role (Cognito group membership).

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-manage-user`
**CORS:** Yes

**Path Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `userId` | string | Yes |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | Yes | One of: `admin`, `caseworker`, `manager` |

**Success Response (200):**

```json
{
  "message": "Role updated successfully"
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "role is required"}` |
| 400 | `{"error": "role must be one of: [...]"}` |
| 404 | `{"error": "User not found"}` |
| 500 | `{"error": "..."}` |

---

### 5.4 PUT /admin/users/{userId}/status

Enable or disable a user account.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-manage-user`
**CORS:** Yes

**Path Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `userId` | string | Yes |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `active` | boolean | Yes | `true` to enable, `false` to disable |

**Success Response (200):**

```json
{
  "message": "Status updated successfully"
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "active (boolean) is required"}` |
| 404 | `{"error": "User not found"}` |
| 500 | `{"error": "..."}` |

---

### 5.5 DELETE /admin/users/{userId}

Delete a user from Cognito.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-manage-user`
**CORS:** Yes

**Path Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `userId` | string | Yes |

**Success Response (200):**

```json
{
  "message": "User deleted successfully"
}
```

**Errors:**

| Code | Body |
|------|------|
| 404 | `{"error": "User not found"}` |
| 500 | `{"error": "..."}` |

---

## 6. Admin — Policies

### 6.1 GET /admin/policies

List all policies.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-manage-policy`
**CORS:** Yes

**Success Response (200):**

```json
{
  "policies": [
    {
      "id": "policy-uuid",
      "version": 1,
      "orgId": "councilA",
      "caseType": "hardship-fund",
      "subType": null,
      "status": "active",
      "effectiveDate": "2026-01-01",
      "retiredDate": null,
      "createdBy": "system",
      "createdAt": "2026-03-05T16:02:38Z"
    }
  ]
}
```

---

### 6.2 GET /admin/policies/{policyId}

Get full policy detail including documents and rules.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-manage-policy`
**CORS:** Yes

**Path Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `policyId` | string | Yes |

**Success Response (200):**

```json
{
  "id": "policy-uuid",
  "version": 1,
  "orgId": "councilA",
  "caseType": "hardship-fund",
  "subType": null,
  "status": "active",
  "effectiveDate": "2026-01-01",
  "retiredDate": null,
  "createdBy": "system",
  "createdAt": "2026-03-05T16:02:38Z",
  "documents": [
    {
      "id": "doc-uuid",
      "documentType": "id_proof",
      "mandatory": true,
      "acceptedFormats": ["pdf", "jpg", "png"]
    }
  ],
  "rules": [
    {
      "id": "rule-uuid",
      "ruleName": "income_threshold",
      "fieldName": "monthly_income",
      "operator": ">=",
      "comparisonValue": 500,
      "isBlocking": true,
      "description": "Minimum income check",
      "sortOrder": 1
    }
  ]
}
```

**Errors:**

| Code | Body |
|------|------|
| 404 | `{"error": "Policy not found"}` |
| 500 | `{"error": "..."}` |

---

### 6.3 POST /admin/policies

Create a new policy.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-manage-policy`
**CORS:** Yes

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `orgId` | string | Yes | — | Organisation ID |
| `caseType` | string | Yes | — | Case type |
| `subType` | string | No | — | Sub-type |
| `status` | string | No | `draft` | Policy status |
| `createdBy` | string | No | — | Creator identifier |

**Success Response (201):**

```json
{
  "message": "Policy created",
  "policyId": "new-policy-uuid"
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "orgId and caseType are required"}` |
| 500 | `{"error": "..."}` |

---

### 6.4 PUT /admin/policies/{policyId}

Update a policy's status or dates.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-manage-policy`
**CORS:** Yes

**Path Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `policyId` | string | Yes |

**Request Body (at least one required):**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | New status (e.g. `active`, `draft`, `retired`) |
| `effectiveDate` | string | Date policy takes effect |
| `retiredDate` | string | Date policy retires |

**Success Response (200):**

```json
{
  "message": "Policy updated successfully"
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "No fields to update"}` |
| 404 | `{"error": "Policy not found"}` |
| 500 | `{"error": "..."}` |

---

### 6.5 DELETE /admin/policies/{policyId}

Delete a policy.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-manage-policy`
**CORS:** Yes

**Path Parameters:**

| Param | Type | Required |
|-------|------|----------|
| `policyId` | string | Yes |

**Success Response (200):**

```json
{
  "message": "Policy deleted successfully"
}
```

**Errors:**

| Code | Body |
|------|------|
| 404 | `{"error": "Policy not found"}` |
| 500 | `{"error": "..."}` |

---

## 7. User Profile

### 7.1 GET /users/me

Get the authenticated user's profile.

**Auth:** Cognito JWT required (user sub used as userId)
**Lambda:** `case-triage-dev-user-profile`
**CORS:** Yes

**Success Response (200):**

```json
{
  "id": "cognito-sub-uuid",
  "name": "Jane Smith",
  "email": "jane@council.gov.uk",
  "role": "caseworker",
  "department": "Benefits",
  "phone": "+44 7700 900000",
  "preferences": {
    "notifications": {},
    "theme": "light"
  }
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "userId required (from authorizer or query param userId)"}` |
| 404 | `{"error": "User not found"}` |
| 500 | `{"error": "..."}` |

---

### 7.2 PUT /users/me

Update the authenticated user's profile.

**Auth:** Cognito JWT required
**Lambda:** `case-triage-dev-user-profile`
**CORS:** Yes

**Request Body (all optional):**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name |
| `phone` | string | Phone number |
| `department` | string | Department name |
| `preferences` | object | `{ notifications: {}, theme: "light" \| "dark" }` |

**Success Response (200):**

```json
{
  "message": "Profile updated successfully"
}
```

**Errors:**

| Code | Body |
|------|------|
| 400 | `{"error": "Invalid JSON body"}` |
| 404 | `{"error": "User not found"}` |
| 500 | `{"error": "..."}` |

---

## 8. Frontend Usage Matrix

Which frontend calls which API:

| # | Endpoint | React App (Next.js) | Vite Portal |
|---|----------|---------------------|-------------|
| 1 | `POST /applications/init` | — | `submit.js` |
| 2 | `PUT (S3 presigned)` | — | `submit.js` |
| 3 | `POST /applications/complete` | — | `submit.js` |
| 4 | `GET /cases` | `useCases` hook → Dashboard, Cases, Escalated | — |
| 5 | `GET /cases/{caseId}` | `useCaseDetail` hook → Case detail page | — |
| 6 | `GET /cases/{caseId}/status` | — | `submit.js` (polling) |
| 7 | `GET /cases/{caseId}/pack` | — | `casepack.js` |
| 8 | `POST /cases/{caseId}/decision` | `DecisionPanel` component | `review.js` |
| 9 | `PUT /cases/{caseId}/assign` | Not wired (hook exists) | — |
| 10 | `POST /cases/{caseId}/email` | `email-review/page.tsx` | — |
| 11 | `GET /notifications` | `useNotifications` hook | — |
| 12 | `PUT /notifications/{id}/read` | `useMarkNotificationRead` hook | — |
| 13 | `GET /admin/users` | Uses mock data (API module exists) | — |
| 14 | `POST /admin/users` | Uses mock data (API module exists) | — |
| 15 | `PUT /admin/users/{id}/role` | Uses mock data (API module exists) | — |
| 16 | `PUT /admin/users/{id}/status` | Uses mock data (API module exists) | — |
| 17 | `DELETE /admin/users/{id}` | Uses mock data (API module exists) | — |
| 18 | `GET /admin/policies` | Uses local state (API module exists) | — |
| 19 | `GET /admin/policies/{id}` | Uses local state (API module exists) | — |
| 20 | `POST /admin/policies` | Uses local state (API module exists) | — |
| 21 | `PUT /admin/policies/{id}` | Uses local state (API module exists) | — |
| 22 | `DELETE /admin/policies/{id}` | Uses local state (API module exists) | — |
| 23 | `GET /users/me` | Not wired (API module exists) | — |
| 24 | `PUT /users/me` | Not wired (API module exists) | — |

---

## 9. Error Response Format

All errors follow a consistent structure:

```json
{
  "statusCode": 400,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"error\": \"description of what went wrong\"}"
}
```

Common status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (user, policy) |
| 400 | Bad request / validation failure |
| 401 | Unauthorized (missing or invalid JWT) |
| 403 | Forbidden |
| 404 | Resource not found |
| 409 | Conflict (duplicate case, user already exists) |
| 422 | Unprocessable entity (missing documents) |
| 500 | Internal server error |

---

## 10. Authentication

**Provider:** AWS Cognito
**User Pool ID:** `eu-west-2_mdahf4b4f`
**Client ID:** `1eqhshg0c0lg2orutmr2g322s1`

**Auth flows enabled:** `USER_PASSWORD_AUTH`, `USER_SRP_AUTH`, `REFRESH_TOKEN_AUTH`

**User groups:** `ADMIN`, `CASEWORKER`, `MANAGER`

**Getting a token:**

```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 1eqhshg0c0lg2orutmr2g322s1 \
  --auth-parameters USERNAME=testadmin@example.com,PASSWORD='CaseTriage2026!'
```

**Using the token:**

```
Authorization: Bearer <IdToken from response>
```

**Exceptions (no auth required):**
- `GET /cases/{caseId}/status`
- `GET /cases/{caseId}/pack`

---

## 11. CORS

**Intake routes** (`/applications/*`): No CORS headers.

**All other routes**: CORS enabled via OPTIONS preflight:

| Header | Value |
|--------|-------|
| `Access-Control-Allow-Origin` | `*` |
| `Access-Control-Allow-Headers` | `Content-Type,x-api-key,Authorization` |
| `Access-Control-Allow-Methods` | Per-route (e.g. `GET,OPTIONS`, `POST,OPTIONS`) |

---

## Appendix: Complete Route Table

| # | Method | Path | Lambda | Auth | CORS |
|---|--------|------|--------|------|------|
| 1 | POST | `/applications/init` | `application-init` | Cognito | No |
| 2 | POST | `/applications/complete` | `application-finalize` | Cognito | No |
| 3 | GET | `/cases` | `list-cases` | Cognito | Yes |
| 4 | GET | `/cases/{caseId}` | `get-case-detail` | Cognito | Yes |
| 5 | GET | `/cases/{caseId}/status` | `get-case-status` | None | Yes |
| 6 | GET | `/cases/{caseId}/pack` | `get-case-pack` | None | Yes |
| 7 | POST | `/cases/{caseId}/decision` | `record-decision` | Cognito | Yes |
| 8 | PUT | `/cases/{caseId}/assign` | `assign-case` | Cognito | Yes |
| 9 | POST | `/cases/{caseId}/email` | `send-decision-email` | Cognito | Yes |
| 10 | GET | `/notifications` | `get-notifications` | Cognito | Yes |
| 11 | PUT | `/notifications/{notificationId}/read` | `mark-notification-read` | Cognito | Yes |
| 12 | GET | `/admin/users` | `list-users` | Cognito | Yes |
| 13 | POST | `/admin/users` | `manage-user` | Cognito | Yes |
| 14 | PUT | `/admin/users/{userId}/role` | `manage-user` | Cognito | Yes |
| 15 | PUT | `/admin/users/{userId}/status` | `manage-user` | Cognito | Yes |
| 16 | DELETE | `/admin/users/{userId}` | `manage-user` | Cognito | Yes |
| 17 | GET | `/admin/policies` | `manage-policy` | Cognito | Yes |
| 18 | POST | `/admin/policies` | `manage-policy` | Cognito | Yes |
| 19 | GET | `/admin/policies/{policyId}` | `manage-policy` | Cognito | Yes |
| 20 | PUT | `/admin/policies/{policyId}` | `manage-policy` | Cognito | Yes |
| 21 | DELETE | `/admin/policies/{policyId}` | `manage-policy` | Cognito | Yes |
| 22 | GET | `/users/me` | `user-profile` | Cognito | Yes |
| 23 | PUT | `/users/me` | `user-profile` | Cognito | Yes |

**Total: 23 API endpoints** (plus S3 presigned upload which bypasses API Gateway)
