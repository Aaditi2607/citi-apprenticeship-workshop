"""Business logic for CRUD, authentication, search, and analytics."""

from auth import create_token, hash_password, verify_password
from db import execute
from utils import require_fields, to_float, to_int


EMPLOYEE_SELECT_COLUMNS = [
    "employee_id",
    "first_name",
    "last_name",
    "email",
    "role",
    "COALESCE(performance_score, 0) AS performance_score",
    "skill_gap",
    "development_plan",
    "COALESCE(NULLIF(status, ''), 'Active') AS status",
    "joining_date",
]


RESOURCE_CONFIG = {
    "employees": {
        "table": "employees",
        "id": "employee_id",
        "fields": [
            "first_name",
            "last_name",
            "email",
            "role",
            "performance_score",
            "skill_gap",
            "development_plan",
            "status",
            "joining_date",
            "team_id",
            "manager_id",
        ],
        "required": ["first_name", "last_name", "email", "role", "joining_date"],
    },
    "teams": {
        "table": "teams",
        "id": "team_id",
        "fields": ["team_name", "location", "leader_id"],
        "required": ["team_name", "location"],
    },
    "reviews": {
        "table": "performance_reviews",
        "id": "review_id",
        "fields": ["employee_id", "reviewer_id", "rating", "feedback", "review_date"],
        "required": ["employee_id", "reviewer_id", "rating", "feedback", "review_date"],
    },
    "performance-reviews": {
        "table": "performance_reviews",
        "id": "review_id",
        "fields": ["employee_id", "reviewer_id", "rating", "feedback", "review_date"],
        "required": ["employee_id", "reviewer_id", "rating", "feedback", "review_date"],
    },
    "skills": {
        "table": "skills",
        "id": "skill_id",
        "fields": ["skill_name", "category"],
        "required": ["skill_name", "category"],
    },
    "employee-skills": {
        "table": "employee_skills",
        "id": "employee_skill_id",
        "fields": ["employee_id", "skill_id", "proficiency_level"],
        "required": ["employee_id", "skill_id", "proficiency_level"],
    },
    "training-records": {
        "table": "training_records",
        "id": "training_id",
        "fields": ["employee_id", "training_name", "completion_date", "certification_status"],
        "required": ["employee_id", "training_name", "certification_status"],
    },
    "development-plans": {
        "table": "development_plans",
        "id": "plan_id",
        "fields": ["employee_id", "goal", "status", "target_date"],
        "required": ["employee_id", "goal", "status", "target_date"],
    },
}


def list_resource(resource, query):
    if resource == "employees":
        return list_employees(query)

    cfg = RESOURCE_CONFIG[resource]
    filters = []
    params = {"limit": to_int(query.get("limit"), 50), "offset": to_int(query.get("offset"), 0)}
    for field in cfg["fields"]:
        if query.get(field) not in (None, ""):
            filters.append(f"{field} = %({field})s")
            params[field] = query[field]

    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    rows = execute(
        f"SELECT * FROM {cfg['table']} {where} ORDER BY {cfg['id']} LIMIT %(limit)s OFFSET %(offset)s",
        params,
        fetchall=True,
    )
    return rows


def get_resource(resource, object_id):
    if resource == "employees":
        return execute(
            f"""
            SELECT {', '.join(EMPLOYEE_SELECT_COLUMNS)}
            FROM employees
            WHERE employee_id = %(id)s
            """,
            {"id": object_id},
            fetchone=True,
        )

    cfg = RESOURCE_CONFIG[resource]
    return execute(
        f"SELECT * FROM {cfg['table']} WHERE {cfg['id']} = %(id)s",
        {"id": object_id},
        fetchone=True,
    )


def _normalize_employee_payload(payload):
    normalized = dict(payload)
    if normalized.get("status") in (None, ""):
        normalized["status"] = "Active"
    if normalized.get("performance_score") in (None, ""):
        normalized["performance_score"] = 0
    return normalized


def create_resource(resource, payload):
    cfg = RESOURCE_CONFIG[resource]
    if resource == "employees":
        payload = _normalize_employee_payload(payload)
    require_fields(payload, cfg["required"])
    fields = [field for field in cfg["fields"] if field in payload]
    placeholders = [f"%({field})s" for field in fields]
    sql = f"""
        INSERT INTO {cfg['table']} ({', '.join(fields)})
        VALUES ({', '.join(placeholders)})
        RETURNING *
    """
    return execute(sql, payload, fetchone=True)


def update_resource(resource, object_id, payload):
    cfg = RESOURCE_CONFIG[resource]
    if resource == "employees":
        payload = _normalize_employee_payload(payload)
    fields = [field for field in cfg["fields"] if field in payload]
    if not fields:
        raise ValueError("No valid fields provided for update")
    assignments = [f"{field} = %({field})s" for field in fields]
    params = dict(payload)
    params["id"] = object_id
    updated = execute(
        f"""
        UPDATE {cfg['table']}
        SET {', '.join(assignments)}
        WHERE {cfg['id']} = %(id)s
        RETURNING *
        """,
        params,
        fetchone=True,
    )
    return updated


def delete_resource(resource, object_id):
    cfg = RESOURCE_CONFIG[resource]
    deleted = execute(
        f"DELETE FROM {cfg['table']} WHERE {cfg['id']} = %(id)s RETURNING {cfg['id']}",
        {"id": object_id},
        fetchone=True,
    )
    return deleted


def list_employees(query):
    filters = []
    params = {
        "limit": to_int(query.get("limit"), 50),
        "offset": to_int(query.get("offset"), 0),
    }

    if query.get("search"):
        filters.append("(LOWER(e.first_name) LIKE %(search)s OR LOWER(e.last_name) LIKE %(search)s)")
        params["search"] = f"%{query['search'].lower()}%"
    if query.get("team_id"):
        filters.append("e.team_id = %(team_id)s")
        params["team_id"] = to_int(query.get("team_id"))
    if query.get("email"):
        filters.append("e.email = %(email)s")
        params["email"] = query["email"]
    if query.get("skill_id"):
        filters.append("es.skill_id = %(skill_id)s")
        params["skill_id"] = to_int(query.get("skill_id"))
    if query.get("min_rating"):
        filters.append("rating_stats.avg_rating >= %(min_rating)s")
        params["min_rating"] = to_float(query.get("min_rating"))

    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    return execute(
        f"""
        SELECT DISTINCT
            e.employee_id,
            e.first_name,
            e.last_name,
            e.email,
            e.role,
            COALESCE(e.performance_score, 0) AS performance_score,
            e.skill_gap,
            e.development_plan,
            COALESCE(NULLIF(e.status, ''), 'Active') AS status,
            e.joining_date,
            t.team_name,
            COALESCE(rating_stats.avg_rating, 0) AS average_rating
        FROM employees e
        LEFT JOIN teams t ON t.team_id = e.team_id
        LEFT JOIN employee_skills es ON es.employee_id = e.employee_id
        LEFT JOIN (
            SELECT employee_id, AVG(rating) AS avg_rating
            FROM performance_reviews
            GROUP BY employee_id
        ) rating_stats ON rating_stats.employee_id = e.employee_id
        {where}
        ORDER BY e.employee_id
        LIMIT %(limit)s OFFSET %(offset)s
        """,
        params,
        fetchall=True,
    )


def signup(payload):
    require_fields(payload, ["username", "email", "password", "role"])
    if payload["role"] not in ("Admin", "Manager", "Employee"):
        raise ValueError("Role must be Admin, Manager, or Employee")
    existing = execute(
        "SELECT user_id FROM users WHERE username = %(username)s OR email = %(email)s",
        payload,
        fetchone=True,
    )
    if existing:
        raise ValueError("Username or email already exists")

    user = execute(
        """
        INSERT INTO users (username, email, password_hash, role)
        VALUES (%(username)s, %(email)s, %(password_hash)s, %(role)s)
        RETURNING user_id, username, email, role
        """,
        {
            "username": payload["username"],
            "email": payload["email"],
            "password_hash": hash_password(payload["password"]),
            "role": payload["role"],
        },
        fetchone=True,
    )
    return user


def login(payload):
    require_fields(payload, ["username", "password"])
    user = execute(
        "SELECT user_id, username, email, password_hash, role FROM users WHERE username = %(username)s",
        payload,
        fetchone=True,
    )
    if not user or not verify_password(payload["password"], user["password_hash"]):
        raise PermissionError("Invalid username or password")
    public_user = {
        "user_id": user["user_id"],
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],
    }
    return {"token": create_token(public_user), "user": public_user}


def dashboard_summary():
    row = execute(
        """
        SELECT
            (SELECT COUNT(*) FROM employees) AS total_employees,
            COALESCE((SELECT AVG(rating) FROM performance_reviews), 0) AS average_rating,
            COALESCE((SELECT AVG(NULLIF(performance_score, 0)) FROM employees), 0) AS average_performance,
            (SELECT COUNT(*) FROM training_records WHERE LOWER(certification_status) IN ('completed', 'certified', 'passed')) AS completed_trainings
        """,
        fetchone=True,
    )
    distribution = execute(
        """
        SELECT bucket AS name, COUNT(*) AS count
        FROM (
            SELECT
                CASE
                    WHEN COALESCE(performance_score, 0) < 2 THEN '1-2'
                    WHEN COALESCE(performance_score, 0) < 3 THEN '2-3'
                    WHEN COALESCE(performance_score, 0) < 4 THEN '3-4'
                    ELSE '4-5'
                END AS bucket,
                CASE
                    WHEN COALESCE(performance_score, 0) < 2 THEN 1
                    WHEN COALESCE(performance_score, 0) < 3 THEN 2
                    WHEN COALESCE(performance_score, 0) < 4 THEN 3
                    ELSE 4
                END AS bucket_order
            FROM employees
        ) scored
        GROUP BY bucket, bucket_order
        ORDER BY bucket_order
        """,
        fetchall=True,
    )
    status_breakdown = execute(
        """
        SELECT COALESCE(NULLIF(status, ''), 'Active') AS name, COUNT(*) AS value
        FROM employees
        GROUP BY COALESCE(NULLIF(status, ''), 'Active')
        ORDER BY value DESC, name
        """,
        fetchall=True,
    )
    status_counts = {item["name"]: item["value"] for item in status_breakdown}
    row["promotion_ready_employees"] = status_counts.get("Promotion Ready", 0)
    row["high_risk_employees"] = status_counts.get("Needs Training", 0)
    row["performance_distribution"] = distribution
    row["status_breakdown"] = status_breakdown
    return row


def promotion_readiness():
    rows = execute(
        """
        SELECT
            e.employee_id,
            e.first_name || ' ' || e.last_name AS employee_name,
            COALESCE(AVG(DISTINCT pr.rating), 0) AS average_rating,
            COUNT(DISTINCT tr.training_id) FILTER (
                WHERE LOWER(tr.certification_status) IN ('completed', 'certified', 'passed')
            ) AS completed_trainings,
            COALESCE(AVG(es.proficiency_level), 0) AS average_skill_level
        FROM employees e
        LEFT JOIN performance_reviews pr ON pr.employee_id = e.employee_id
        LEFT JOIN training_records tr ON tr.employee_id = e.employee_id
        LEFT JOIN employee_skills es ON es.employee_id = e.employee_id
        GROUP BY e.employee_id
        ORDER BY e.employee_id
        """,
        fetchall=True,
    )
    for row in rows:
        row["promotion_ready"] = (
            float(row["average_rating"]) >= 4.2
            and row["completed_trainings"] >= 2
            and float(row["average_skill_level"]) >= 4.0
        )
    return rows


def attrition_risk():
    employees = execute(
        "SELECT employee_id, first_name || ' ' || last_name AS employee_name FROM employees ORDER BY employee_id",
        fetchall=True,
    )
    results = []
    for employee in employees:
        reviews = execute(
            """
            SELECT rating FROM performance_reviews
            WHERE employee_id = %(employee_id)s
            ORDER BY review_date
            """,
            employee,
            fetchall=True,
        )
        incomplete_plans = execute(
            """
            SELECT COUNT(*) AS count FROM development_plans
            WHERE employee_id = %(employee_id)s
            AND LOWER(status) NOT IN ('completed', 'done')
            """,
            employee,
            fetchone=True,
        )
        incomplete_training = execute(
            """
            SELECT COUNT(*) AS count FROM training_records
            WHERE employee_id = %(employee_id)s
            AND LOWER(certification_status) NOT IN ('completed', 'certified', 'passed')
            """,
            employee,
            fetchone=True,
        )
        reasons = []
        if len(reviews) >= 2 and reviews[-1]["rating"] < reviews[0]["rating"]:
            reasons.append("Declining performance rating")
        if incomplete_plans["count"] > 0:
            reasons.append("Incomplete development plan")
        if incomplete_training["count"] > 0:
            reasons.append("Incomplete training")
        risk_level = "High" if len(reasons) >= 2 else "Medium" if reasons else "Low"
        results.append({**employee, "risk_level": risk_level, "reasons": reasons})
    return results


def skill_gap_analysis():
    distribution = execute(
        """
        SELECT
            s.skill_id,
            s.skill_name,
            s.category,
            COUNT(es.employee_skill_id) AS employee_count,
            COALESCE(AVG(es.proficiency_level), 0) AS average_proficiency
        FROM skills s
        LEFT JOIN employee_skills es ON es.skill_id = s.skill_id
        GROUP BY s.skill_id
        ORDER BY s.category, s.skill_name
        """,
        fetchall=True,
    )
    missing = [row for row in distribution if row["employee_count"] == 0 or float(row["average_proficiency"]) < 3]
    return {"skill_distribution": distribution, "missing_or_weak_skills": missing}
