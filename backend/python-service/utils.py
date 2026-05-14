"""Small Lambda-friendly helpers for JSON, routing, and validation."""

import json
from datetime import date, datetime
from decimal import Decimal
from urllib.parse import parse_qs


JSON_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
}


def json_default(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return str(value)


def response(status_code=200, data=None, message=None, success=True):
    body = {"success": success}
    if message is not None:
        body["message"] = message
    if data is not None:
        body["data"] = data
    return {
        "statusCode": status_code,
        "headers": JSON_HEADERS,
        "body": json.dumps(body, default=json_default),
    }


def error_response(status_code, message):
    return response(status_code=status_code, success=False, message=message)


def parse_body(event):
    body = event.get("body")
    if not body:
        return {}
    if event.get("isBase64Encoded"):
        import base64

        body = base64.b64decode(body).decode("utf-8")
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        raise ValueError("Request body must be valid JSON")


def normalize_path(event):
    """Return path pieces after removing workshop proxy prefixes.

    Local proxy calls look like /api/python-service/employees in the browser,
    but Lambda usually receives /employees. This handles both shapes.
    """
    path = event.get("rawPath") or event.get("path") or "/"
    parts = [part for part in path.split("/") if part]
    if len(parts) >= 2 and parts[0] == "api":
        parts = parts[2:]
    if parts and parts[0] == "python-service":
        parts = parts[1:]
    return parts


def get_method(event):
    return (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod")
        or "GET"
    ).upper()


def get_query_params(event):
    params = event.get("queryStringParameters") or {}
    if params:
        return params
    raw_query = event.get("rawQueryString") or ""
    return {key: values[-1] for key, values in parse_qs(raw_query).items()}


def require_fields(payload, fields):
    missing = [field for field in fields if payload.get(field) in (None, "")]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")


def to_int(value, default=None):
    if value in (None, ""):
        return default
    return int(value)


def to_float(value, default=None):
    if value in (None, ""):
        return default
    return float(value)

