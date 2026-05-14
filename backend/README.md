# Coding Workshop - Backend Code

## Overview

This folder contains Lambda-style backend services for the coding workshop.
Python with PostgreSQL is the preferred implementation for this project.

The deployable service for the Employee Performance & Development Management
System is:

```txt
backend/python-service/
```

## Workshop Service Structure

```txt
backend/python-service/
├── function.py
├── db.py
├── services.py
├── auth.py
├── utils.py
├── requirements.txt
└── README.md
```

Terraform auto-discovers services by looking for `function.py` one level under
`backend/`. Folders prefixed with `_`, such as `_examples`, are ignored.

## Environment Variables

The workshop injects these PostgreSQL variables automatically:

| Variable | Local Default |
| --- | --- |
| `IS_LOCAL` | `true` |
| `POSTGRES_HOST` | `localhost` or `172.17.0.1` through LocalStack |
| `POSTGRES_PORT` | `5432` |
| `POSTGRES_NAME` | `postgres` |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASS` | `postgres123` |

## Local Development

Start the workshop environment:

```sh
./bin/start-dev.sh
```

The local proxy exposes the Python Lambda service at:

```txt
http://localhost:3001/api/python-service
```

Example:

```sh
curl http://localhost:3001/api/python-service/health
```

## Cloud Deployment

Deploy backend infrastructure:

```sh
./bin/deploy-backend.sh
```

Deploy frontend after backend:

```sh
./bin/deploy-frontend.sh
```

## Notes

- Do not place deployable code under `backend/_examples`.
- Do not run a separate FastAPI or uvicorn server for this workshop service.
- The Lambda handler is `function.handler`.

