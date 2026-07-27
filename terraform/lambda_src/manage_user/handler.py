"""
Admin user operations. Routes:
- POST /admin/users - Create user
- PUT /admin/users/{userId}/role - Update role
- PUT /admin/users/{userId}/status - Toggle active
- DELETE /admin/users/{userId} - Delete user
Env: COGNITO_USER_POOL_ID, AURORA_CLUSTER_ARN, AURORA_SECRET_ARN, AURORA_DATABASE
"""

import json
import os
import boto3

cognito = boto3.client("cognito-idp")
rds_data = boto3.client("rds-data", region_name=os.environ.get("AWS_REGION", "eu-west-2"))

COGNITO_USER_POOL_ID = os.environ["COGNITO_USER_POOL_ID"]
AURORA_CLUSTER_ARN = os.environ["AURORA_CLUSTER_ARN"]
AURORA_SECRET_ARN = os.environ["AURORA_SECRET_ARN"]
AURORA_DATABASE = os.environ["AURORA_DATABASE"]

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-api-key",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
}


def _response(status_code: int, body: dict):
    return {"statusCode": status_code, "headers": CORS_HEADERS, "body": json.dumps(body)}


def _aurora_execute(sql: str):
    rds_data.execute_statement(
        resourceArn=AURORA_CLUSTER_ARN,
        secretArn=AURORA_SECRET_ARN,
        database=AURORA_DATABASE,
        sql=sql,
    )


def _get_method(event):
    return (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod", "")
    )


def _get_path(event):
    return (
        event.get("requestContext", {}).get("http", {}).get("path")
        or event.get("path", "")
        or event.get("resource", "")
    )


def _get_path_params(event):
    return event.get("pathParameters") or {}


def _parse_body(event):
    try:
        return json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return {}


def _create_user(body):
    email = body.get("email")
    name = body.get("name", "")
    role = body.get("role", "CASEWORKER").upper()
    department = body.get("department", "")

    if not email:
        return _response(400, {"error": "email is required"})

    if not role:
        return _response(400, {"error": "role is required"})

    valid_roles = ["ADMIN", "CASEWORKER", "MANAGER"]
    if role not in valid_roles:
        return _response(400, {"error": f"role must be one of: {valid_roles}"})

    try:
        user_attrs = [
            {"Name": "email", "Value": email},
            {"Name": "email_verified", "Value": "true"},
        ]
        if name:
            user_attrs.append({"Name": "name", "Value": name})

        resp = cognito.admin_create_user(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=email,
            UserAttributes=user_attrs,
            TemporaryPassword=os.environ.get("DEFAULT_TEMP_PASSWORD", "TempPass123!"),
            DesiredDeliveryMediums=["EMAIL"],
        )

        cognito.admin_add_user_to_group(
            UserPoolId=COGNITO_USER_POOL_ID, Username=email, GroupName=role
        )

        if department:
            try:
                cognito.admin_update_user_attributes(
                    UserPoolId=COGNITO_USER_POOL_ID,
                    Username=email,
                    UserAttributes=[{"Name": "custom:department", "Value": department}],
                )
            except Exception as e:
                print(f"Setting custom:department failed (optional): {e}")

        try:
            esc_email = email.replace("'", "''")
            esc_name = name.replace("'", "''")
            _aurora_execute(
                f"""
                INSERT INTO caseworkers (email, full_name, role_id)
                SELECT '{esc_email}', '{esc_name}',
                       (SELECT role_id FROM roles WHERE role_name = '{role}' LIMIT 1)
                WHERE NOT EXISTS (SELECT 1 FROM caseworkers WHERE email = '{esc_email}')
                """
            )
        except Exception as e:
            print(f"Aurora caseworkers insert failed (optional): {e}")

        created_user = resp.get("User", {})
        username = created_user.get("Username", email)
        created_at = created_user.get("UserCreateDate")
        created_str = created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at or "")

        return _response(201, {
            "message": "User created successfully",
            "user": {
                "id": username,
                "name": name,
                "email": email,
                "role": role,
                "status": "ACTIVE",
                "department": department,
                "casesAssigned": 0,
                "lastLogin": "",
                "createdAt": created_str,
            },
        })

    except cognito.exceptions.UsernameExistsException:
        return _response(409, {"error": "User already exists"})
    except Exception as e:
        print(f"ERROR create user: {e}")
        return _response(500, {"error": str(e)})


def _update_role(user_id, body):
    role = body.get("role", "").upper()
    if not role:
        return _response(400, {"error": "role is required"})

    valid_roles = ["ADMIN", "CASEWORKER", "MANAGER"]
    if role not in valid_roles:
        return _response(400, {"error": f"role must be one of: {valid_roles}"})

    try:
        gr = cognito.admin_list_groups_for_user(
            UserPoolId=COGNITO_USER_POOL_ID, Username=user_id
        )
        for g in gr.get("Groups", []):
            cognito.admin_remove_user_from_group(
                UserPoolId=COGNITO_USER_POOL_ID,
                Username=user_id,
                GroupName=g.get("GroupName", ""),
            )
        cognito.admin_add_user_to_group(
            UserPoolId=COGNITO_USER_POOL_ID, Username=user_id, GroupName=role
        )

        try:
            u = cognito.admin_get_user(UserPoolId=COGNITO_USER_POOL_ID, Username=user_id)
            email = next((a["Value"] for a in u.get("UserAttributes", []) if a["Name"] == "email"), user_id)
            _aurora_execute(
                f"""
                UPDATE caseworkers SET role_id = (SELECT role_id FROM roles WHERE role_name = '{role}' LIMIT 1)
                WHERE email = '{email.replace("'", "''")}'
                """
            )
        except Exception:
            pass

        return _response(200, {"message": "Role updated successfully"})

    except cognito.exceptions.UserNotFoundException:
        return _response(404, {"error": "User not found"})
    except Exception as e:
        print(f"ERROR update role: {e}")
        return _response(500, {"error": str(e)})


def _update_status(user_id, body):
    status = body.get("status", "").upper()
    if status not in ("ACTIVE", "INACTIVE"):
        return _response(400, {"error": "status must be ACTIVE or INACTIVE"})

    active = status == "ACTIVE"

    try:
        if active:
            cognito.admin_enable_user(
                UserPoolId=COGNITO_USER_POOL_ID, Username=user_id
            )
        else:
            cognito.admin_disable_user(
                UserPoolId=COGNITO_USER_POOL_ID, Username=user_id
            )

        try:
            u = cognito.admin_get_user(UserPoolId=COGNITO_USER_POOL_ID, Username=user_id)
            email = next((a["Value"] for a in u.get("UserAttributes", []) if a["Name"] == "email"), user_id)
            esc_email = email.replace("'", "''")
            _aurora_execute(
                f"UPDATE caseworkers SET active = {str(active).lower()} WHERE email = '{esc_email}'"
            )
        except Exception:
            pass

        return _response(200, {"message": "Status updated successfully"})

    except cognito.exceptions.UserNotFoundException:
        return _response(404, {"error": "User not found"})
    except Exception as e:
        print(f"ERROR update status: {e}")
        return _response(500, {"error": str(e)})


def _delete_user(user_id):
    try:
        email = user_id
        try:
            u = cognito.admin_get_user(UserPoolId=COGNITO_USER_POOL_ID, Username=user_id)
            email = next((a["Value"] for a in u.get("UserAttributes", []) if a["Name"] == "email"), user_id)
        except Exception:
            pass

        cognito.admin_delete_user(
            UserPoolId=COGNITO_USER_POOL_ID, Username=user_id
        )

        try:
            esc_email = email.replace("'", "''")
            _aurora_execute(
                f"UPDATE caseworkers SET active = FALSE WHERE email = '{esc_email}'"
            )
        except Exception:
            pass

        return _response(200, {"message": "User deleted successfully"})

    except cognito.exceptions.UserNotFoundException:
        return _response(404, {"error": "User not found"})
    except Exception as e:
        print(f"ERROR delete user: {e}")
        return _response(500, {"error": str(e)})


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = _get_method(event)
    path = _get_path(event)
    path_params = _get_path_params(event)
    user_id = path_params.get("userId", "")

    if method == "POST" and ("/admin/users" in path or path == "/admin/users"):
        body = _parse_body(event)
        return _create_user(body)

    if method == "PUT" and user_id:
        body = _parse_body(event)
        if "/role" in path:
            return _update_role(user_id, body)
        if "/status" in path:
            return _update_status(user_id, body)

    if method == "DELETE" and user_id:
        return _delete_user(user_id)

    return _response(400, {"error": "Unknown operation"})
