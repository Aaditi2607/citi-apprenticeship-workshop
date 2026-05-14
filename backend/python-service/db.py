"""PostgreSQL connection and query helpers for the Lambda service."""

import os

import psycopg2
from psycopg2.extras import RealDictCursor


CONNECTION = None
SCHEMA_READY = False


def _connection_kwargs():
    is_local = os.getenv("IS_LOCAL", "true").lower() == "true"
    kwargs = {
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": int(os.getenv("POSTGRES_PORT", "5432")),
        "dbname": os.getenv("POSTGRES_NAME", "postgres"),
        "user": os.getenv("POSTGRES_USER", "postgres"),
        "password": os.getenv("POSTGRES_PASS", "postgres123"),
        "connect_timeout": 10,
    }
    if not is_local:
        kwargs["sslmode"] = "require"
    return kwargs


def get_connection():
    global CONNECTION
    if CONNECTION is None or CONNECTION.closed:
        CONNECTION = psycopg2.connect(**_connection_kwargs())
        CONNECTION.autocommit = False
    return CONNECTION


def execute(sql, params=None, fetchone=False, fetchall=False):
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params or {})
            result = None
            if fetchone:
                result = cur.fetchone()
            elif fetchall:
                result = cur.fetchall()
            conn.commit()
            return result
    except Exception:
        conn.rollback()
        raise


def ensure_schema():
    """Create all required tables once per warm Lambda container."""
    global SCHEMA_READY
    if SCHEMA_READY:
        return

    execute(
        """
        CREATE TABLE IF NOT EXISTS teams (
            team_id SERIAL PRIMARY KEY,
            team_name VARCHAR(150) UNIQUE NOT NULL,
            location VARCHAR(150) NOT NULL,
            leader_id INTEGER
        );

        CREATE TABLE IF NOT EXISTS employees (
            employee_id SERIAL PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(100) NOT NULL,
            performance_score NUMERIC(3,2) DEFAULT 0,
            skill_gap TEXT,
            development_plan TEXT,
            status VARCHAR(50) DEFAULT 'Active',
            joining_date DATE NOT NULL,
            team_id INTEGER REFERENCES teams(team_id) ON DELETE SET NULL,
            manager_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL
        );

        ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS performance_score NUMERIC(3,2) DEFAULT 0;

        ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS skill_gap TEXT;

        ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS development_plan TEXT;

        ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';

        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'fk_teams_leader_id'
            ) THEN
                ALTER TABLE teams
                ADD CONSTRAINT fk_teams_leader_id
                FOREIGN KEY (leader_id) REFERENCES employees(employee_id) ON DELETE SET NULL;
            END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS performance_reviews (
            review_id SERIAL PRIMARY KEY,
            employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
            reviewer_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
            rating NUMERIC(3,2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
            feedback TEXT NOT NULL,
            review_date DATE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS skills (
            skill_id SERIAL PRIMARY KEY,
            skill_name VARCHAR(120) UNIQUE NOT NULL,
            category VARCHAR(100) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS employee_skills (
            employee_skill_id SERIAL PRIMARY KEY,
            employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
            skill_id INTEGER NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
            proficiency_level INTEGER NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5),
            UNIQUE(employee_id, skill_id)
        );

        CREATE TABLE IF NOT EXISTS training_records (
            training_id SERIAL PRIMARY KEY,
            employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
            training_name VARCHAR(200) NOT NULL,
            completion_date DATE,
            certification_status VARCHAR(50) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS development_plans (
            plan_id SERIAL PRIMARY KEY,
            employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
            goal TEXT NOT NULL,
            status VARCHAR(50) NOT NULL,
            target_date DATE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role VARCHAR(30) NOT NULL CHECK (role IN ('Admin', 'Manager', 'Employee'))
        );

        CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(first_name, last_name);
        CREATE INDEX IF NOT EXISTS idx_employees_team ON employees(team_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_employee ON performance_reviews(employee_id);
        CREATE INDEX IF NOT EXISTS idx_employee_skills_employee ON employee_skills(employee_id);
        """
    )
    SCHEMA_READY = True
