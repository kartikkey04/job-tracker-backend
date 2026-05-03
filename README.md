# Job Tracker API 🎯

An AI-powered job application tracker REST API built with **Node.js**, **Express**, **TypeScript**, **PostgreSQL**, and **Redis**.

## Architecture

```
Client (Postman / Frontend)
        │
        ▼
  Express API (TypeScript)
        │
   ┌────┴────────────────┐
   │                     │
PostgreSQL            Redis
(users, jobs,      (caching, rate
 history)           limiting, sessions)
   │
   └──── OpenAI API (AI features)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express.js |
| Database | PostgreSQL 15 |
| Cache / Rate Limit | Redis 7 |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod |
| Testing | Jest + Supertest |
| Containerization | Docker + docker-compose |
| CI/CD | GitHub Actions |
| AI | OpenAI gpt-4o-mini |

## Features

- **Auth** — register, login, JWT refresh token rotation, logout
- **Job tracking** — full CRUD with status history on every update
- **Filtering & pagination** — filter by status, sort, paginate
- **Dashboard stats** — counts per status
- **AI cover letter** — 3 variants (formal, conversational, concise)
- **AI interview tips** — likely questions + research points
- **AI resume matcher** — keyword match score + suggestions
- **Redis caching** — identical AI requests return cached results
- **Rate limiting** — 5 AI requests/hour per user via Redis

## DB Schema

```
users
  id, name, email, password_hash, refresh_token, created_at

job_applications
  id, user_id → users, company_name, role_title, job_description
  status (enum), applied_date, interview_date, salary_range
  job_url, notes, created_at, updated_at

status_history
  id, job_id → job_applications, old_status, new_status, note, changed_at

ai_cache
  cache_key, response, type, created_at, expires_at
```

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd job-tracker-api
npm install
```

### 2. Environment setup

```bash
cp .env.example .env
# Fill in your values in .env
```

### 3. Start with Docker (recommended)

```bash
docker-compose up --build
```

### 4. Or run locally (requires Postgres + Redis running)

```bash
npm run dev
```

### 5. Verify it's running

```bash
curl http://localhost:3000/health
```

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, get tokens |
| POST | `/api/auth/refresh` | ❌ | Refresh access token |
| POST | `/api/auth/logout` | ✅ | Logout |
| GET | `/api/auth/me` | ✅ | Get current user |

### Jobs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/jobs` | List jobs (filter, sort, paginate) |
| POST | `/api/jobs` | Create job application |
| GET | `/api/jobs/stats` | Dashboard stats by status |
| GET | `/api/jobs/:id` | Get job + status history |
| PUT | `/api/jobs/:id` | Update job / change status |
| DELETE | `/api/jobs/:id` | Delete job |

### AI (rate limited: 5 req/hour)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/cover-letter` | Generate 3 cover letter variants |
| POST | `/api/ai/interview-tips` | Get questions + tips for a role |
| POST | `/api/ai/resume-match` | Score resume vs job description |

## Example Requests

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"Password1"}'
```

### Create job
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Razorpay",
    "role_title": "Backend Engineer",
    "job_description": "Node.js developer with 2+ years...",
    "status": "applied",
    "job_url": "https://razorpay.com/jobs/123"
  }'
```

### Generate cover letter
```bash
curl -X POST http://localhost:3000/api/ai/cover-letter \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Razorpay",
    "role_title": "Backend Engineer",
    "job_description": "We are looking for a Node.js developer..."
  }'
```

## Running Tests

```bash
npm test               # run all tests
npm run test:watch     # watch mode
```

## What I'd improve at scale

- Add WebSocket support for real-time status updates
- Email notifications for interview reminders (BullMQ + Nodemailer)
- OAuth2 login (Google)
- Export jobs to CSV
- Admin dashboard with analytics
