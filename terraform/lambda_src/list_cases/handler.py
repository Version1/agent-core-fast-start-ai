"""
GET /cases - Lists cases from DynamoDB case_runtime_state table.
Query params: status (optional GSI filter), limit (default 20, max 100),
nextToken (base64 ExclusiveStartKey), assignedTo (optional filter).

Derives applicantName from extractedData JSON since the intake pipeline
does not store it as a top-level attribute.
"""

import base64
import json
import os
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource("dynamodb")

TABLE = os.environ["DYNAMODB_TABLE"]

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
}


class _DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)


def _response(status_code: int, body: dict):
    return {"statusCode": status_code, "headers": CORS_HEADERS, "body": json.dumps(body, cls=_DecimalEncoder)}


def _extract_applicant_name(item: dict) -> str:
    """Best-effort extraction of applicant name from available DynamoDB fields."""
    raw = item.get("extractedData")
    if raw:
        try:
            data = json.loads(raw) if isinstance(raw, str) else raw
            for doc_key in ("id_proof", "bank_statement_jan"):
                fields = data.get(doc_key) if isinstance(data, dict) else {}
                if isinstance(fields, dict):
                    name = fields.get("applicant_name")
                    if name:
                        return name
            if isinstance(data, dict) and data.get("applicant_name"):
                return data["applicant_name"]
        except (json.JSONDecodeError, TypeError):
            pass

    summary_raw = item.get("caseSummary")
    if summary_raw:
        try:
            summary = json.loads(summary_raw) if isinstance(summary_raw, str) else summary_raw
            overview = (summary.get("case_summary") or {}).get("applicant_overview", "")
            if overview:
                return overview.split(".")[0][:60]
        except (json.JSONDecodeError, TypeError):
            pass

    return item.get("caseId", "Unknown")


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    try:
        params = event.get("queryStringParameters") or {}
        status = params.get("status")
        limit = min(int(params.get("limit", 50)), 100)
        next_token = params.get("nextToken")
        assigned_to = params.get("assignedTo")

        table = dynamodb.Table(TABLE)
        exclusive_start_key = None
        if next_token:
            try:
                exclusive_start_key = json.loads(base64.b64decode(next_token).decode("utf-8"))
            except Exception as e:
                print(f"Invalid nextToken: {e}")
                return _response(400, {"error": "Invalid nextToken"})

        if status:
            kwargs = {
                "IndexName": "status-index",
                "KeyConditionExpression": Key("status").eq(status),
                "Limit": limit,
            }
            if exclusive_start_key:
                kwargs["ExclusiveStartKey"] = exclusive_start_key
            if assigned_to:
                kwargs["FilterExpression"] = Attr("assignedTo").eq(assigned_to)
            response = table.query(**kwargs)
        else:
            kwargs = {"Limit": limit}
            if exclusive_start_key:
                kwargs["ExclusiveStartKey"] = exclusive_start_key
            if assigned_to:
                kwargs["FilterExpression"] = Attr("assignedTo").eq(assigned_to)
            response = table.scan(**kwargs)

        items = response.get("Items", [])
        last_key = response.get("LastEvaluatedKey")

        cases = []
        _conf_map = {"HIGH": 85, "MEDIUM": 60, "LOW": 35}
        for item in items:
            ai_confidence = item.get("aiConfidence")
            if ai_confidence is not None and isinstance(ai_confidence, Decimal):
                ai_confidence = int(ai_confidence) if ai_confidence % 1 == 0 else float(ai_confidence)
            if ai_confidence is None:
                try:
                    raw = item.get("caseSummary")
                    cs = json.loads(raw) if isinstance(raw, str) else (raw or {})
                    label = (cs.get("data_quality_assessment") or {}).get("overall_confidence", "").upper()
                    if label in _conf_map:
                        ai_confidence = _conf_map[label]
                except Exception:
                    pass
            cases.append({
                "caseId": item.get("caseId", ""),
                "applicantName": _extract_applicant_name(item),
                "applicationType": item.get("caseType", ""),
                "status": item.get("status", ""),
                "priority": item.get("priority", "MEDIUM"),
                "assignedTo": item.get("assignedTo", ""),
                "assignedToName": item.get("assignedToName", ""),
                "updatedAt": item.get("updatedAt", ""),
                "aiConfidence": ai_confidence,
                "createdAt": item.get("createdAt", ""),
            })

        next_token_out = None
        if last_key:
            next_token_out = base64.b64encode(json.dumps(last_key).encode("utf-8")).decode("utf-8")

        return _response(200, {"cases": cases, "nextToken": next_token_out})

    except ValueError as e:
        print(f"Validation error: {e}")
        return _response(400, {"error": str(e)})
    except Exception as e:
        print(f"ERROR: {e}")
        return _response(500, {"error": str(e)})
