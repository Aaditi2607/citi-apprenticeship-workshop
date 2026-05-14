"""Lightweight password hashing, token creation, and RBAC helpers."""

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Optional


SECRET = os.getenv("JWT_SECRET_KEY") or os.getenv("APP_SECRET") or "workshop-local-secret"
TOKEN_EXP_SECONDS = int(os.getenv("TOKEN_EXP_SECONDS", "86400"))


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("utf-8")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120000)
    return f"pbkdf2_sha256${_b64url_encode(salt)}${_b64url_encode(digest)}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, salt_value, digest_value = stored_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        salt = _b64url_decode(salt_value)
        expected = _b64url_decode(digest_value)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120000)
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def create_token(user: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user["user_id"],
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],
        "exp": int(time.time()) + TOKEN_EXP_SECONDS,
    }
    signing_input = f"{_b64url_encode(json.dumps(header).encode())}.{_b64url_encode(json.dumps(payload).encode())}"
    signature = hmac.new(SECRET.encode("utf-8"), signing_input.encode("utf-8"), hashlib.sha256).digest()
    return f"{signing_input}.{_b64url_encode(signature)}"


def verify_token(token: str) -> dict:
    try:
        header_part, payload_part, signature_part = token.split(".")
        signing_input = f"{header_part}.{payload_part}"
        expected = hmac.new(SECRET.encode("utf-8"), signing_input.encode("utf-8"), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url_decode(signature_part), expected):
            raise ValueError("Invalid token signature")
        payload = json.loads(_b64url_decode(payload_part))
        if payload.get("exp", 0) < int(time.time()):
            raise ValueError("Token expired")
        return payload
    except Exception as exc:
        raise PermissionError("Invalid or expired token") from exc


def get_bearer_token(headers: Optional[dict]) -> Optional[str]:
    headers = headers or {}

    # Handle lowercase and uppercase headers
    auth_header = (
        headers.get("authorization")
        or headers.get("Authorization")
    )

    if not auth_header:
        return None

    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()

    return auth_header.strip()


def require_auth(event) -> dict:
    headers = event.get("headers") or {}

    token = get_bearer_token(headers)

    if not token:
        raise PermissionError("Authentication token is required")

    return verify_token(token)


def require_roles(user: dict, allowed_roles):
    if user.get("role") not in allowed_roles:
        raise PermissionError("You do not have permission to perform this action")

