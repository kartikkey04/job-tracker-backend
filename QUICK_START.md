# Quick Start Guide for Postman Testing

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start Database (Option A - Docker)
```bash
# Start PostgreSQL and Redis
docker run -d --name postgres-jobtracker \
  -e POSTGRES_DB=job_tracker \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15-alpine

docker run -d --name redis-jobtracker \
  -p 6379:6379 \
  redis:7-alpine
```

### 4. Start Database (Option B - Local)
If you have PostgreSQL and Redis installed locally:
```bash
# Start PostgreSQL service
sudo systemctl start postgresql

# Start Redis service  
sudo systemctl start redis

# Create database
createdb job_tracker
```

### 5. Start API Server
```bash
npm run dev
```

### 6. Test API Health
```bash
curl http://localhost:3000/health
```

## 📮 Postman Setup

1. **Import Collection**:
   - Open Postman
   - Click "Import" 
   - Select `Job Tracker API.postman_collection.json`

2. **Set Environment Variables**:
   - The collection automatically sets:
     - `baseUrl`: http://localhost:3000
     - `accessToken`: Auto-populated after login
     - `refreshToken`: Auto-populated after login

3. **Test Workflow**:
   1. Run "Register User" (creates account + sets tokens)
   2. Run "Create Job Application" 
   3. Try AI features (requires OpenAI API key in .env)
   4. Explore other endpoints

## 🔧 API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - User login  
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Job Management  
- `GET /api/jobs` - List jobs (with filtering/pagination)
- `POST /api/jobs` - Create job application
- `GET /api/jobs/:id` - Get job details + history
- `PUT /api/jobs/:id` - Update job or change status
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/stats` - Dashboard statistics

### AI Features (5 requests/hour limit)
- `POST /api/ai/cover-letter` - Generate 3 cover letter variants
- `POST /api/ai/interview-tips` - Get interview questions + tips
- `POST /api/ai/resume-match` - Score resume vs job description

### Health
- `GET /health` - API health check

## 🧪 Testing Examples

### Register & Login
```json
POST /api/auth/register
{
    "name": "John Doe",
    "email": "john@example.com", 
    "password": "Password123"
}
```

### Create Job
```json
POST /api/jobs
Authorization: Bearer <token>
{
    "company_name": "Tech Corp",
    "role_title": "Software Engineer",
    "job_description": "Node.js developer position...",
    "status": "applied",
    "job_url": "https://techcorp.com/jobs/123"
}
```

### Generate Cover Letter
```json
POST /api/ai/cover-letter
Authorization: Bearer <token>
{
    "company_name": "Tech Corp",
    "role_title": "Software Engineer", 
    "job_description": "Looking for Node.js developer..."
}
```

## 🔍 Troubleshooting

### Server Won't Start
- Check PostgreSQL/Redis are running
- Verify .env configuration
- Check port 3000 isn't in use

### Database Connection Error
```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d job_tracker

# Test Redis connection  
redis-cli ping
```

### AI Features Not Working
- Add OpenAI API key to .env: `OPENAI_API_KEY=sk-your-key`
- Check rate limiting (5 requests/hour)

### Authentication Issues
- Verify token format: `Authorization: Bearer <token>`
- Check token hasn't expired (15 min access, 7 days refresh)

## 📊 Monitoring

### Check Logs
Server logs show:
- Database connections
- API requests  
- Error details
- Rate limiting

### Test Coverage
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

## 🐛 Common Issues

1. **Port 3000 already in use**: Kill process or change PORT in .env
2. **Database connection failed**: Check PostgreSQL is running and credentials match
3. **Redis connection failed**: Check Redis service is active
4. **OpenAI API errors**: Verify API key and check usage limits
5. **Rate limiting hit**: Wait 1 hour or use different user account
