# import json

# # CORS headers to allow React frontend to communicate with this Lambda
# CORS_HEADERS = {
#     "Access-Control-Allow-Origin": "*",
#     "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
#     "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
#     "Content-Type": "application/json"
# }

# # Mock employee data for ACME Inc. Performance Platform
# EMPLOYEES = [
#     {
#         "id": "EMP001",
#         "name": "Priya Sharma",
#         "role": "Senior Software Engineer",
#         "performance_score": 4.7,
#         "skill_gap": "System Design",
#         "development_plan": "Complete AWS Solutions Architect Certification",
#         "status": "High Achiever"
#     },
#     {
#         "id": "EMP002",
#         "name": "Rahul Mehta",
#         "role": "Frontend Developer",
#         "performance_score": 3.2,
#         "skill_gap": "React Hooks",
#         "development_plan": "Complete React Advanced Patterns Course",
#         "status": "Needs Training"
#     },
#     {
#         "id": "EMP003",
#         "name": "Ananya Iyer",
#         "role": "Data Analyst",
#         "performance_score": 4.5,
#         "skill_gap": "Machine Learning",
#         "development_plan": "Enroll in AWS ML Specialty Certification",
#         "status": "High Achiever"
#     },
#     {
#         "id": "EMP004",
#         "name": "Karan Patel",
#         "role": "DevOps Engineer",
#         "performance_score": 2.8,
#         "skill_gap": "Kubernetes Orchestration",
#         "development_plan": "Complete CKA (Certified Kubernetes Administrator) Course",
#         "status": "Needs Training"
#     },
#     {
#         "id": "EMP005",
#         "name": "Sneha Reddy",
#         "role": "Product Manager",
#         "performance_score": 4.9,
#         "skill_gap": "Financial Modelling",
#         "development_plan": "Complete Product-Led Growth Strategy Workshop",
#         "status": "Promotion Ready"
#     }
# ]


# def handler(event, context):
#     """
#     AWS Lambda handler for ACME Inc. Employee Performance Platform.

#     Supports:
#       - OPTIONS  -> CORS preflight response
#       - GET      -> Returns full list of employees
#       - Any other method -> 405 Method Not Allowed
#     """

#     http_method = event.get("httpMethod", "GET")

#     # Handle CORS preflight request from browser
#     if http_method == "OPTIONS":
#         return {
#             "statusCode": 200,
#             "headers": CORS_HEADERS,
#             "body": json.dumps({"message": "CORS preflight OK"})
#         }

#     # Handle GET: return employee list
#     if http_method == "GET":
#         return {
#             "statusCode": 200,
#             "headers": CORS_HEADERS,
#             "body": json.dumps({
#                 "success": True,
#                 "count": len(EMPLOYEES),
#                 "employees": EMPLOYEES
#             })
#         }

#     # Any other HTTP method is not supported
#     return {
#         "statusCode": 405,
#         "headers": CORS_HEADERS,
#         "body": json.dumps({
#             "success": False,
#             "message": f"Method '{http_method}' not allowed. Use GET."
#         })
#     }

import json
import os
import psycopg2
import psycopg2.extras

# ── DB connection ────────────────────────────────────────────────────────────

def get_connection():
    # Hardcoded to use the workshop's Docker-to-Host bridge IP
    return psycopg2.connect(
        host="172.17.0.1",
        dbname="postgres",
        user="postgres",
        password="password",
        connect_timeout=5,
    )

# ── Ensure table exists ──────────────────────────────────────────────────────

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS employees (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(255)   NOT NULL,
    role              VARCHAR(255)   NOT NULL,
    performance_score NUMERIC(4,2)   DEFAULT 0,
    skill_gap         VARCHAR(255)   DEFAULT '',
    status            VARCHAR(100)   DEFAULT 'Active'
);
"""

def ensure_table(cur):
    cur.execute(CREATE_TABLE_SQL)

# ── CORS headers ─────────────────────────────────────────────────────────────

CORS_HEADERS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-user-role",
}

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(body),
    }

# ── Handler ───────────────────────────────────────────────────────────────────

def handler(event, context):
    method = event.get("httpMethod", "GET").upper()

    # Preflight
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    # RBAC – Viewers cannot write
    user_role = (event.get("headers") or {}).get("x-user-role", "")
    if method == "POST" and user_role == "Viewer":
        return response(403, {"error": "Forbidden: Viewers cannot perform POST requests."})

    try:
        conn = get_connection()
        conn.autocommit = False
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        ensure_table(cur)

        # ── GET ──────────────────────────────────────────────────────────────
        if method == "GET":
            cur.execute("SELECT * FROM employees ORDER BY id;")
            rows = cur.fetchall()
            conn.commit()
            return response(200, {
                "success": True,
                "count": len(rows),
                "employees": [dict(r) for r in rows],
            })

        # ── POST ─────────────────────────────────────────────────────────────
        if method == "POST":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return response(400, {"error": "Invalid JSON body."})

            # Validate required fields
            missing = [f for f in ("name", "role") if not body.get(f)]
            if missing:
                return response(400, {"error": f"Missing required fields: {', '.join(missing)}"})

            cur.execute(
                """
                INSERT INTO employees (name, role, performance_score, skill_gap, status)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (
                    body["name"],
                    body["role"],
                    body.get("performance_score", 0),
                    body.get("skill_gap", ""),
                    body.get("status", "Active"),
                ),
            )
            new_row = dict(cur.fetchone())
            conn.commit()
            return response(201, {"success": True, "employee": new_row})

        # ── Unsupported method ────────────────────────────────────────────────
        return response(405, {"error": f"Method {method} not allowed."})

    except psycopg2.OperationalError as e:
        return response(503, {"error": "Database connection failed.", "detail": str(e)})
    except Exception as e:
        return response(500, {"error": "Internal server error.", "detail": str(e)})
    finally:
        try:
            if 'cur' in locals(): cur.close()
            if 'conn' in locals(): conn.close()
        except Exception:
            pass