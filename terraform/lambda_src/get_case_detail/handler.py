"""
GET /cases/{caseId} - Full case detail from DynamoDB + Aurora + S3.
Combines: DynamoDB metadata, Aurora cases/documents/extracted_data/
eval_outcomes/case_summaries/validation_results, presigned S3 URLs, audit trail.

Falls back to S3 object listing when Aurora documents table is empty
(the intake pipeline uploads docs directly via presigned URLs without
writing to Aurora).
"""

import json
import os
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal
from botocore.config import Config

dynamodb = boto3.resource("dynamodb")
rds_data = boto3.client("rds-data")

AWS_REGION = os.environ.get("AWS_ACCOUNT_REGION", "eu-west-2")
s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
)

TABLE = os.environ["DYNAMODB_TABLE"]
AUDIT_TRAIL_TABLE = os.environ["AUDIT_TRAIL_TABLE"]
AURORA_CLUSTER_ARN = os.environ["AURORA_CLUSTER_ARN"]
AURORA_SECRET_ARN = os.environ["AURORA_SECRET_ARN"]
AURORA_DATABASE = os.environ["AURORA_DATABASE"]
DOCUMENTS_BUCKET = os.environ["DOCUMENTS_BUCKET"]
PRESIGN_TTL = 900

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
}


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)


def _response(status_code: int, body: dict):
    return {"statusCode": status_code, "headers": CORS_HEADERS, "body": json.dumps(body, cls=DecimalEncoder)}


def _rds_param(name: str, value) -> dict:
    if value is None:
        return {"name": name, "value": {"isNull": True}}
    if isinstance(value, bool):
        return {"name": name, "value": {"booleanValue": value}}
    if isinstance(value, int):
        return {"name": name, "value": {"longValue": value}}
    if isinstance(value, float):
        return {"name": name, "value": {"doubleValue": value}}
    return {"name": name, "value": {"stringValue": str(value)}}


def _rds_query(sql: str, params: list = None) -> list:
    try:
        kwargs = {
            "resourceArn": AURORA_CLUSTER_ARN,
            "secretArn": AURORA_SECRET_ARN,
            "database": AURORA_DATABASE,
            "sql": sql,
        }
        if params:
            kwargs["parameters"] = params
        resp = rds_data.execute_statement(**kwargs)
        cols = [c["name"] for c in resp.get("columnMetadata", [])]
        rows = []
        for rec in resp.get("records", []):
            row = {}
            for col, field in zip(cols, rec):
                val = next(iter(field.values())) if field else None
                row[col] = val
            rows.append(row)
        return rows
    except Exception as e:
        print(f"Aurora query failed (non-fatal): {e}")
        return []


_CONTENT_TYPE_MAP = {
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "webp": "image/webp",
    "svg": "image/svg+xml",
    "tif": "image/tiff",
    "tiff": "image/tiff",
    "bmp": "image/bmp",
}


def _presign_url(bucket: str, key: str, ttl: int = PRESIGN_TTL) -> str:
    ext = key.rsplit(".", 1)[-1].lower() if "." in key else ""
    content_type = _CONTENT_TYPE_MAP.get(ext, "application/octet-stream")
    return s3_client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": bucket,
            "Key": key,
            "ResponseContentDisposition": "inline",
            "ResponseContentType": content_type,
        },
        ExpiresIn=ttl,
    )


def _safe_json(val):
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, str) and val:
        try:
            return json.loads(val)
        except (json.JSONDecodeError, TypeError):
            return {}
    return {}


DOC_DISPLAY_NAMES = {
    "id_proof": "Identity Document (Passport)",
    "bank_statement_jan": "Bank Statement — January",
    "bank_statement_dec": "Bank Statement — December",
    "bank_statement_nov": "Bank Statement — November",
    "tenancy_agreement": "Tenancy Agreement",
}


def _get_documents_from_s3(org_id: str, case_type: str, case_id: str) -> list:
    """List actual S3 objects at the known document prefix and generate presigned URLs."""
    prefix = f"{org_id}/{case_type}/{case_id}/documents/"
    documents = []
    try:
        resp = s3_client.list_objects_v2(Bucket=DOCUMENTS_BUCKET, Prefix=prefix)
        for obj in resp.get("Contents", []):
            s3_key = obj["Key"]
            filename = s3_key.rsplit("/", 1)[-1]
            doc_type = filename.replace(".pdf", "")
            display_name = DOC_DISPLAY_NAMES.get(doc_type, doc_type)
            view_url = _presign_url(DOCUMENTS_BUCKET, s3_key)
            documents.append({
                "id": doc_type,
                "name": display_name,
                "type": doc_type,
                "uploadedAt": obj.get("LastModified", "").isoformat() if hasattr(obj.get("LastModified", ""), "isoformat") else "",
                "size": obj.get("Size", 0),
                "viewUrl": view_url,
                "downloadUrl": view_url,
            })
    except Exception as e:
        print(f"S3 document listing failed: {e}")
    return documents


def _extract_applicant_fields(item: dict) -> dict:
    """Extract applicant info from DynamoDB extractedData JSON."""
    raw = item.get("extractedData")
    data = _safe_json(raw)

    merged = {}
    for doc_key in ("id_proof", "bank_statement_jan"):
        fields = data.get(doc_key) if isinstance(data, dict) else {}
        if isinstance(fields, dict):
            for k, v in fields.items():
                if k not in merged and v is not None:
                    merged[k] = v
    if isinstance(data, dict) and not any(k in data for k in ("id_proof", "bank_statement_jan")):
        merged = data

    return {
        "applicantName": merged.get("applicant_name", ""),
        "applicantEmail": merged.get("email") or item.get("applicantEmail", ""),
        "niNumber": merged.get("national_insurance_number", ""),
        "dob": merged.get("date_of_birth", ""),
        "phone": merged.get("phone", ""),
        "address": merged.get("address", ""),
        "monthlyIncome": merged.get("monthly_income_gbp"),
        "accountBalance": merged.get("account_balance_gbp"),
        "monthlyRent": merged.get("monthly_rent_gbp"),
        "employmentStatus": merged.get("employment_status", ""),
    }


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    path_params = event.get("pathParameters") or {}
    case_id = path_params.get("caseId") or path_params.get("id", "")

    if not case_id:
        return _response(400, {"error": "caseId required"})

    try:
        # 1. DynamoDB case metadata
        table = dynamodb.Table(TABLE)
        resp = table.get_item(Key={"caseId": case_id})
        item = resp.get("Item")
        if not item:
            return _response(404, {"error": f"Case {case_id} not found"})

        org_id = item.get("orgId", "")
        case_type = item.get("caseType", "")

        # 2. Extract applicant fields from extractedData
        applicant = _extract_applicant_fields(item)

        # 3. Documents: try Aurora first, fall back to S3 listing
        doc_rows = _rds_query(
            "SELECT document_id, document_type, s3_key, s3_bucket FROM documents WHERE case_id = :cid",
            [_rds_param("cid", case_id)],
        )
        if doc_rows:
            documents = []
            for d in doc_rows:
                s3_key = d.get("s3_key") or ""
                s3_bucket = d.get("s3_bucket") or DOCUMENTS_BUCKET
                view_url = _presign_url(s3_bucket, s3_key) if s3_key else ""
                documents.append({
                    "id": str(d.get("document_id", "")),
                    "name": DOC_DISPLAY_NAMES.get(d.get("document_type", ""), d.get("document_type", "")),
                    "type": d.get("document_type", ""),
                    "uploadedAt": "",
                    "viewUrl": view_url,
                    "downloadUrl": view_url,
                })
        else:
            documents = _get_documents_from_s3(org_id, case_type, case_id)

        # 4. Extracted data (structured)
        extracted_data = _safe_json(item.get("extractedData"))
        merged_extracted = {}
        if isinstance(extracted_data, dict):
            for doc_key, fields in extracted_data.items():
                if isinstance(fields, dict) and "error" not in fields:
                    for k, v in fields.items():
                        if k not in merged_extracted and v is not None:
                            merged_extracted[k] = v
        if not merged_extracted and isinstance(extracted_data, dict):
            merged_extracted = extracted_data

        # 5. Policy evaluation — try Aurora, fall back to DynamoDB policyResult
        eval_rows = _rds_query(
            "SELECT rule_id, result, explanation, is_blocking FROM eval_outcomes WHERE case_id = :cid",
            [_rds_param("cid", case_id)],
        )
        if eval_rows:
            rule_evaluations = [
                {"ruleId": str(r.get("rule_id", "")), "passed": r.get("result") == "PASS",
                 "reason": r.get("explanation"), "blocking": r.get("is_blocking")}
                for r in eval_rows
            ]
        else:
            policy_result = _safe_json(item.get("policyResult"))
            rule_evaluations = []
            for r in policy_result.get("rule_results", []):
                rule_evaluations.append({
                    "ruleId": r.get("rule_id", ""),
                    "rule": r.get("name", ""),
                    "passed": r.get("status") == "PASS",
                    "reason": r.get("rationale", ""),
                    "blocking": r.get("blocking", True),
                    "status": r.get("status", ""),
                })

        # 6. Case summary — try Aurora, fall back to DynamoDB caseSummary
        sum_rows = _rds_query(
            "SELECT priority, complexity, recommendation, supervisor_review, risk_flags, strengths, concerns, summary_json FROM case_summaries WHERE case_id = :cid",
            [_rds_param("cid", case_id)],
        )
        summary_row = sum_rows[0] if sum_rows else {}

        case_summary = _safe_json(item.get("caseSummary"))
        ai_summary_text = ""
        ai_recommendation = None

        if case_summary:
            cs = case_summary.get("case_summary", {})
            ai_summary_text = cs.get("applicant_overview", "")
            key_findings = cs.get("key_findings", [])
            if key_findings:
                ai_summary_text += "\n\nKey findings:\n" + "\n".join(f"• {f}" for f in key_findings)

            rec = case_summary.get("recommendation", {})
            action = rec.get("suggested_next_action", "")
            if action:
                ai_summary_text += f"\n\nRecommended action: {action}"

        if summary_row.get("recommendation"):
            rec_str = str(summary_row["recommendation"]).upper()
            if "APPROVE" in rec_str:
                ai_recommendation = "APPROVE"
            elif "DECLINE" in rec_str:
                ai_recommendation = "DECLINE"

        if not ai_recommendation and case_summary:
            policy_result = _safe_json(item.get("policyResult"))
            overall = policy_result.get("overall_status", "")
            if overall == "ELIGIBLE":
                ai_recommendation = "APPROVE"
            elif overall == "INELIGIBLE":
                ai_recommendation = "DECLINE"

        # 7. Validation results
        val_rows = _rds_query(
            "SELECT document_type, is_valid, failure_reason FROM validation_results WHERE case_id = :cid",
            [_rds_param("cid", case_id)],
        )
        validation_results = [
            {"documentType": r.get("document_type"), "isValid": r.get("is_valid"), "reason": r.get("failure_reason")}
            for r in val_rows
        ]

        # 8. Audit trail from DynamoDB
        audit_table = dynamodb.Table(AUDIT_TRAIL_TABLE)
        try:
            audit_resp = audit_table.query(KeyConditionExpression=Key("caseId").eq(case_id))
            audit_items = audit_resp.get("Items", [])
        except Exception:
            audit_items = []

        audit_trail = []
        for a in sorted(audit_items, key=lambda x: x.get("eventAt", "")):
            action = a.get("action") or (a.get("fromStatus", "") + " → " + a.get("toStatus", ""))
            detail = a.get("details")
            if isinstance(detail, str):
                try:
                    detail = json.loads(detail) if detail else {}
                except json.JSONDecodeError:
                    detail = {}
            audit_trail.append({
                "caseId": case_id,
                "eventAt": a.get("eventAt", ""),
                "agent": a.get("agent", ""),
                "action": action,
                "detail": detail or {},
            })

        # 9. AI confidence — read from DynamoDB, fall back to caseSummary
        ai_confidence = item.get("aiConfidence")
        if ai_confidence is not None and isinstance(ai_confidence, Decimal):
            ai_confidence = float(ai_confidence)
        if ai_confidence is None and case_summary:
            conf_label = case_summary.get("data_quality_assessment", {}).get("overall_confidence", "").upper()
            _conf_map = {"HIGH": 85, "MEDIUM": 60, "LOW": 35}
            if conf_label in _conf_map:
                ai_confidence = _conf_map[conf_label]

        # 10. Caseworker notes from summary
        caseworker_notes = []
        if case_summary:
            caseworker_notes = case_summary.get("caseworker_notes", [])

        detail = {
            "caseId": case_id,
            "status": item.get("status", ""),
            "priority": item.get("priority", "MEDIUM"),
            "applicantName": applicant["applicantName"] or item.get("caseId", ""),
            "applicantEmail": applicant["applicantEmail"],
            "applicationType": case_type,
            "assignedTo": item.get("assignedTo", ""),
            "assignedToName": item.get("assignedToName", ""),
            "createdAt": item.get("createdAt", ""),
            "updatedAt": item.get("updatedAt", ""),
            "submittedAt": item.get("createdAt", ""),
            "aiConfidence": ai_confidence,
            "aiRecommendation": ai_recommendation,
            "aiSummary": ai_summary_text,
            "notes": "\n".join(caseworker_notes) if caseworker_notes else (summary_row.get("recommendation") or ""),
            "niNumber": applicant["niNumber"],
            "dob": applicant["dob"],
            "phone": applicant["phone"],
            "documents": documents,
            "extractedData": merged_extracted,
            "ruleEvaluations": rule_evaluations,
            "validationResults": validation_results,
            "activityHistory": audit_trail,
        }

        return _response(200, detail)

    except Exception as e:
        print(f"ERROR for case {case_id}: {e}")
        import traceback
        traceback.print_exc()
        return _response(500, {"error": str(e), "caseId": case_id})
