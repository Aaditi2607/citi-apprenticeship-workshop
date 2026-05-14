# Python Lambda Service

Workshop-compatible Lambda backend for the Employee Performance & Development Management System.

## Local Endpoint

After running the workshop dev environment:

```sh
./bin/start-dev.sh
```

Use:

```txt
http://localhost:3001/api/python-service
```

## Routes

- `POST /auth/signup`
- `POST /auth/login`
- `GET /employees`
- `POST /employees`
- `GET /employees/{id}`
- `PUT /employees/{id}`
- `DELETE /employees/{id}`
- `GET /teams`, `POST /teams`, `PUT /teams/{id}`, `DELETE /teams/{id}`
- `GET /reviews`, `POST /reviews`, `PUT /reviews/{id}`, `DELETE /reviews/{id}`
- `GET /skills`, `POST /skills`, `PUT /skills/{id}`, `DELETE /skills/{id}`
- `GET /employee-skills`, `POST /employee-skills`, `PUT /employee-skills/{id}`, `DELETE /employee-skills/{id}`
- `GET /training-records`, `POST /training-records`, `PUT /training-records/{id}`, `DELETE /training-records/{id}`
- `GET /development-plans`, `POST /development-plans`, `PUT /development-plans/{id}`, `DELETE /development-plans/{id}`
- `GET /analytics/dashboard`
- `GET /analytics/promotion-readiness`
- `GET /analytics/attrition-risk`
- `GET /analytics/skill-gaps`

## Example Curl

Create an admin:

```sh
curl -X POST http://localhost:3001/api/python-service/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@acme.com","password":"Admin123!","role":"Admin"}'
```

Login:

```sh
TOKEN=$(curl -s -X POST http://localhost:3001/api/python-service/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' | jq -r '.data.token')
```

Create an employee:

```sh
curl -X POST http://localhost:3001/api/python-service/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"first_name":"Ava","last_name":"Patel","email":"ava.patel@acme.com","role":"Engineer","joining_date":"2024-01-15"}'
```

Search employees:

```sh
curl "http://localhost:3001/api/python-service/employees?search=ava" \
  -H "Authorization: Bearer $TOKEN"
```

Dashboard:

```sh
curl http://localhost:3001/api/python-service/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

