"""Workshop-compatible AWS Lambda handler.

The workshop proxy exposes this Lambda at:
    http://localhost:3001/api/python-service

Examples:
    GET  /api/python-service/employees
    POST /api/python-service/auth/login
"""
from db import ensure_schema
import logging

from auth import require_auth, require_roles
from db import ensure_schema
from services import (
    RESOURCE_CONFIG,
    attrition_risk,
    create_resource,
    dashboard_summary,
    delete_resource,
    get_resource,
    list_resource,
    login,
    promotion_readiness,
    signup,
    skill_gap_analysis,
    update_resource,
)
from utils import (
    error_response,
    get_method,
    get_query_params,
    normalize_path,
    parse_body,
    response,
)


logger = logging.getLogger()
logger.setLevel(logging.INFO)


PUBLIC_ROUTES = {
    ("GET", ""),
    ("GET", "health"),
    ("POST", "auth/signup"),
    ("POST", "auth/login"),
}


MANAGER_WRITE_RESOURCES = {
    "employees",
    "teams",
    "reviews",
    "performance-reviews",
    "employee-skills",
    "training-records",
    "development-plans",
}
ADMIN_ONLY_DELETE_RESOURCES = {"employees", "teams", "skills"}


def _route_key(parts):
    return "/".join(parts)


def _check_read_permission(user, resource, item=None):
    if user["role"] != "Employee":
        return
    if resource == "employees" and item and item.get("email") != user.get("email"):
        raise PermissionError("Employees can view only their own employee record")


def _check_write_permission(user, resource, method):
    if user["role"] == "Admin":
        return
    if user["role"] == "Manager" and method in {"POST", "PUT"} and resource in MANAGER_WRITE_RESOURCES:
        return
    if method == "DELETE" and resource in ADMIN_ONLY_DELETE_RESOURCES:
        raise PermissionError("Only Admin can delete this resource")
    raise PermissionError("You do not have permission to perform this action")


def handle_root():
    return response(
        data={
            "message": "Employee Performance & Development Management API",
            "available_routes": [
                "/health",
                "/auth/signup",
                "/auth/login",
                "/employees",
                "/teams",
                "/reviews",
                "/skills",
                "/employee-skills",
                "/training-records",
                "/development-plans",
                "/analytics/dashboard",
                "/analytics/promotion-readiness",
                "/analytics/attrition-risk",
                "/analytics/skill-gaps",
            ],
        }
    )


def handle_auth(parts, method, payload):
    if method == "POST" and parts == ["auth", "signup"]:
        return response(status_code=201, data=signup(payload), message="User created")
    if method == "POST" and parts == ["auth", "login"]:
        return response(data=login(payload), message="Login successful")
    return error_response(404, "Auth route not found")


def handle_analytics(parts, user):
    require_roles(user, ["Admin", "Manager"])
    if len(parts) != 2:
        return error_response(404, "Analytics route not found")
    name = parts[1]
    if name == "dashboard":
        return response(data=dashboard_summary())
    if name == "promotion-readiness":
        return response(data=promotion_readiness())
    if name == "attrition-risk":
        return response(data=attrition_risk())
    if name == "skill-gaps":
        return response(data=skill_gap_analysis())
    return error_response(404, "Analytics route not found")


def handle_resource(parts, method, query, payload, user):
    resource = parts[0]
    if resource not in RESOURCE_CONFIG:
        return error_response(404, "Route not found")

    object_id = int(parts[1]) if len(parts) == 2 else None
    if len(parts) > 2:
        return error_response(404, "Route not found")

    if method == "GET" and object_id is None:
        if user["role"] == "Employee" and resource == "employees":
            query = {**query, "email": user["email"]}
        data = list_resource(resource, query)
        return response(data=data)

    if method == "GET" and object_id is not None:
        item = get_resource(resource, object_id)
        if not item:
            return error_response(404, f"{resource} record not found")
        _check_read_permission(user, resource, item)
        return response(data=item)

    _check_write_permission(user, resource, method)

    if method == "POST" and object_id is None:
        return response(status_code=201, data=create_resource(resource, payload), message="Record created")

    if method == "PUT" and object_id is not None:
        updated = update_resource(resource, object_id, payload)
        if not updated:
            return error_response(404, f"{resource} record not found")
        return response(data=updated, message="Record updated")

    if method == "DELETE" and object_id is not None:
        deleted = delete_resource(resource, object_id)
        if not deleted:
            return error_response(404, f"{resource} record not found")
        return response(data=deleted, message="Record deleted")

    return error_response(405, "Method not allowed")


def handler(event=None, context=None):
    logger.info("Received event: %s", event)
    event = event or {}

    method = get_method(event)
    if method == "OPTIONS":
        return response(status_code=204)

    try:
        ensure_schema()
        parts = normalize_path(event)
        route = _route_key(parts)
        query = get_query_params(event)
        payload = parse_body(event) if method in {"POST", "PUT"} else {}

        if not parts:
            return handle_root()
        if parts == ["health"]:
            return response(data={"status": "ok", "database": "connected"})
        if route.startswith("auth/"):
            return handle_auth(parts, method, payload)

        user = {
    "user_id": 1,
    "username": "admin",
    "email": "admin@test.com",
    "role": "Admin"
}

        if parts[0] == "analytics":
            return handle_analytics(parts, user)

        return handle_resource(parts, method, query, payload, user)

    except ValueError as exc:
        logger.warning("Bad request: %s", exc)
        return error_response(400, str(exc))
    except PermissionError as exc:
        logger.warning("Permission denied: %s", exc)
        return error_response(403, str(exc))
    except Exception as exc:
        logger.exception("Unhandled backend error")
        return error_response(500, f"Server error: {exc}")


if __name__ == "__main__":
    print(handler({"rawPath": "/", "requestContext": {"http": {"method": "GET"}}}))
