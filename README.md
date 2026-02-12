# Todo API (Express + TypeScript + PostgreSQL)

Simple REST API for user authentication and task management with JWT access tokens and refresh tokens stored in an HTTP-only cookie.

## Tech Stack

- Node.js + Express
- TypeScript
- PostgreSQL
- TypeORM
- Zod (request validation)
- bcrypt (password hashing)

## Current Features

- Register and login users
- JWT access token authentication (`Authorization: Bearer <token>`)
- Refresh token rotation with server-side token hash storage
- Logout endpoint that revokes refresh token
- Protected task CRUD endpoints per authenticated user
- Task listing with pagination metadata

## Project Structure

```text
.
├── index.ts
├── src
│   ├── db/data-source.ts
│   ├── entities/
│   ├── middleware/
│   ├── routes/
│   ├── schema/
│   ├── services/
│   ├── lib/
│   └── utils/jwt.ts
└── package.json
```

## Environment Variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=todo
JWT_SECRET=change_me_to_a_long_random_secret
NODE_ENV=development
CORS_ORIGINS=http://localhost:8080
```

Notes:
- `JWT_SECRET` is optional in code, but should always be set in real usage.
- Refresh token cookie uses `secure: true` only when `NODE_ENV=production`.
- `CORS_ORIGINS` accepts a comma-separated list (for example: `http://localhost:8080,http://localhost:5173`).

## Setup & Run

```bash
npm install
npm run dev
npm run test:auth
```

Server starts on:

```text
http://localhost:3000
```

## Mounted Routes

- `GET /` -> health-like hello message
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (requires access token)
- `POST /api/auth/refresh` (requires refresh token cookie)
- `POST /api/auth/logout`
- `GET /api/tasks` (requires access token)
- `POST /api/tasks` (requires access token)
- `PATCH /api/tasks/:id` (requires access token)
- `DELETE /api/tasks/:id` (requires access token)

## Auth Flow

1. Register or login to receive:
- `access_token` in JSON response body
- `refresh_token` as HTTP-only cookie (`Path=/api/auth`)
2. Send `access_token` in `Authorization` header for protected routes.
3. Call `POST /api/auth/refresh` to rotate refresh token and receive a new access token.
4. Call `POST /api/auth/logout` to revoke current refresh token.

## Request Validation (Zod)

### Register

`POST /api/auth/register`

```json
{
  "email": "user@example.com",
  "password": "secret123",
  "name": "John Doe"
}
```

Rules:
- `email`: valid email
- `password`: 6-100 chars
- `name`: 2-100 chars

### Login

`POST /api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

Rules:
- `email`: valid email
- `password`: 6-100 chars

### Create Task

`POST /api/tasks`

```json
{
  "text": "Buy milk"
}
```

Rules:
- `text`: 1-100 chars

### Update Task

`PATCH /api/tasks/:id`

```json
{
  "text": "Buy milk and eggs",
  "is_completed": true
}
```

Rules:
- `text`: optional, 1-100 chars
- `is_completed`: optional boolean

## Pagination

`GET /api/tasks?current_page=1&limit=10`

Response shape:
- `status`
- `data` (task array)
- `meta_data`
  - `total_pages`
  - `limit`
  - `current_page`
  - `is_prev`
  - `is_next`

## Database

TypeORM is configured in `src/db/data-source.ts` with:
- `synchronize: true`
- `dropSchema: false`

Entities:
- `users`
- `tasks`
- `refresh_tokens`

## Notes

- JWT implementation is custom in `src/utils/jwt.ts` (HMAC SHA-256).
- Access token TTL: 15 minutes.
- Refresh token TTL: 7 days.
- `npm run test:auth` is a smoke test. It expects the backend server to already be running.
