# FileHost - Development Guide

## Quick Start

### With Docker Compose (Recommended)
```bash
# Clone and setup
git clone https://github.com/txrszone/file-hosting-app.git
cd file-hosting-app

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start services
docker-compose up -d

# Wait for services to start (about 30 seconds)
echo "Waiting for services..."
sleep 30

# Access applications
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# MinIO Console: http://localhost:9001 (admin/minioadmin)
# MailHog: http://localhost:8025
```

### Local Development

#### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run migrate  # Run database migrations
npm run seed     # Seed with admin user
npm run dev      # Start dev server on port 5000
```

#### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev      # Start dev server on port 3000
```

## First Steps

### 1. Create Admin Account
Default admin credentials (from seed):
- Email: `admin@filehost.local`
- Password: `Admin123!@#`

### 2. Login and Test
1. Go to http://localhost:3000
2. Click "Sign Up" or "Sign In"
3. Create a test account or use admin
4. Upload a test file
5. Set expiration and sharing settings
6. Copy the public link and test access

### 3. Access Admin Panel
1. Login as admin
2. Click "Admin" in top navigation
3. View dashboard, users, and reports

## API Testing

### Using cURL
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","username":"testuser","password":"Test123!","captchaToken":"test"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test123!","captchaToken":"test"}' \
  -c cookies.txt

# Upload file
curl -X POST http://localhost:5000/api/files/upload \
  -b cookies.txt \
  -F "file=@/path/to/file" \
  -F "expiresIn=7d"

# Get files
curl http://localhost:5000/api/files/my-files \
  -b cookies.txt
```

### Using Postman
1. Import API collection (if available)
2. Set `{{baseURL}}` to `http://localhost:5000`
3. Test endpoints with proper authentication

## Database Management

### Connect to PostgreSQL
```bash
psql -h localhost -U filehost -d filehost
```

### Useful Commands
```sql
-- View tables
\dt

-- View users
SELECT id, email, username, role, status FROM users;

-- View files
SELECT id, user_id, original_name, size, created_at FROM files;

-- View reports
SELECT * FROM file_reports WHERE status = 'pending';

-- Check audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

## Redis Management

```bash
# Connect to Redis
redis-cli

# View keys
KEYS *

# View refresh tokens
KEYS refresh-token:*

# View job queues
QUEUE file-expiration
QUEUE file-cleanup
```

## S3/MinIO Management

### Access MinIO Console
1. Go to http://localhost:9001
2. Login with `minioadmin` / `minioadmin`
3. Create bucket: `filehost`
4. View uploaded files

### Using MinIO CLI
```bash
# List buckets
mc ls minio

# List files in bucket
mc ls minio/filehost

# Copy file from local
mc cp test.pdf minio/filehost/

# Remove file
mc rm minio/filehost/test.pdf
```

## Email Testing

### MailHog Web Interface
1. Go to http://localhost:8025
2. View all emails sent during testing
3. Click on email to view content

## Debugging

### Backend Logs
```bash
# View logs
docker logs filehost-backend -f

# Specific error
docker logs filehost-backend | grep ERROR
```

### Frontend Logs
```bash
# Browser console
# Press F12 or Cmd+Option+I
# View Network, Console tabs
```

### Database Issues
```bash
# Check connection
psql -h localhost -U filehost -d filehost -c "SELECT 1"

# Run migrations
cd backend && npm run migrate

# Seed data
cd backend && npm run seed
```

## Common Issues

### Port Already in Use
```bash
# Find process using port
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :5432  # PostgreSQL

# Kill process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string in .env
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### File Upload Issues
```bash
# Check MinIO is running
docker ps | grep minio

# Check S3 endpoint
curl http://localhost:9000

# Check bucket exists
minio/mc ls minio/filehost
```

### Redis Connection Issues
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli ping

# Check REDIS_URL in .env
echo $REDIS_URL
```

## Performance Tips

1. **Database**: Use indexes on frequently queried columns
2. **Caching**: Redis for session storage and job queues
3. **File Storage**: S3 for scalable storage
4. **Rate Limiting**: Prevent abuse of upload endpoints
5. **Background Jobs**: Async file cleanup and expiration

## Security Reminders

- Never commit `.env` files with real secrets
- Change default passwords in production
- Use strong JWT secrets
- Enable HTTPS in production
- Validate all file uploads
- Sanitize user inputs
- Use CORS appropriately
- Enable rate limiting
- Keep dependencies updated

## Useful Links

- [Express.js Docs](https://expressjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Redis Docs](https://redis.io/documentation)
- [MinIO Docs](https://docs.min.io/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## Getting Help

If you encounter issues:
1. Check Docker logs: `docker logs <container-name>`
2. Verify environment variables
3. Check database migrations
4. Review browser console
5. Open GitHub issue with details

## Next Steps

- [ ] Integrate Turnstile CAPTCHA
- [ ] Add Google OAuth
- [ ] Set up email notifications
- [ ] Configure DNS and SSL
- [ ] Set up monitoring
- [ ] Add more admin features
- [ ] Implement advanced search
- [ ] Add file encryption

---

Happy coding! 🚀
