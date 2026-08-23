# FileHost - Secure File Hosting & Sharing Platform

A full-stack web application for secure file hosting, sharing, and management with advanced administrative features.

## Features

### For Users
- **File Upload & Management**
  - Upload files up to 5GB
  - Set file expiration times (1 hour to 30 days or never)
  - Public sharing links
  - Download tracking
  - Bulk file management

- **Security**
  - Password-protected accounts
  - JWT-based authentication
  - Secure file storage (S3/MinIO)
  - CAPTCHA protection
  - Session management

- **File Sharing**
  - Generate shareable public links
  - Track download count
  - Report inappropriate files
  - File preview capability

### For Administrators
- **User Management**
  - View all users and their details
  - Manage user roles (user, moderator, admin)
  - Suspend or ban users
  - Issue warnings to users
  - View user storage usage

- **Content Moderation**
  - Review reported files
  - Manage file reports
  - Delete inappropriate content
  - Set file report status

- **System Management**
  - Dashboard with key statistics
  - Audit logs for all admin actions
  - System settings configuration
  - Storage and file management

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Storage**: AWS S3 / MinIO
- **Task Queue**: Bull (Redis-backed)
- **Authentication**: JWT, bcrypt
- **Validation**: CAPTCHA (Turnstile)

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API Client**: Axios
- **Data Fetching**: React Query
- **File Upload**: React Dropzone
- **Icons**: Lucide React

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Node.js (Express)
- **Reverse Proxy**: Optional (Nginx/Traefik)

## Project Structure

```
file-hosting-app/
├── backend/                    # Express API server
│   ├── src/
│   │   ├── app.ts             # Express app entry point
│   │   ├── db/                # Database setup and migrations
│   │   ├── middleware/        # Auth, rate limiting, etc.
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   └── jobs/              # Background jobs
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                   # Next.js application
│   ├── app/                   # App router pages
│   │   ├── page.tsx           # Home page
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── admin-panel/       # Admin pages
│   │   └── share/             # Public file sharing
│   ├── components/            # React components
│   ├── lib/                   # Utilities and configs
│   ├── types/                 # TypeScript types
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── .env.example
│
└── docker-compose.yml         # Multi-container orchestration
```

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+
- MinIO (for local S3-compatible storage)

### Development Setup

#### Option 1: Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/txrszone/file-hosting-app.git
cd file-hosting-app

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Build and start all services
docker-compose up -d

# Backend: http://localhost:5000
# Frontend: http://localhost:3000
# MinIO Console: http://localhost:9001 (admin/minioadmin)
# MailHog: http://localhost:1025
```

#### Option 2: Local Development

**Backend Setup**
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

**Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Configuration

**Backend (.env)**
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://filehost:filehost123@localhost:5432/filehost
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
AWS_S3_BUCKET=filehost
AWS_S3_ENDPOINT=http://minio:9000
TURNSTILE_SECRET_KEY=your-turnstile-key
SMTP_HOST=mailhog
SMTP_PORT=1025
ADMIN_EMAIL=admin@filehost.local
ADMIN_PASSWORD=Admin123!@#
```

**Frontend (.env)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-id
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/my-files` - List user's files
- `GET /api/files/:id` - Get file details
- `GET /api/files/:id/download` - Download file
- `PATCH /api/files/:id` - Update file
- `DELETE /api/files/:id` - Delete file
- `POST /api/files/:id/report` - Report file

### Public
- `GET /api/public/:publicLink` - Get public file info
- `GET /api/public/:publicLink/download` - Download public file

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:userId` - Get user details
- `PATCH /api/admin/users/:userId/role` - Update user role
- `POST /api/admin/users/:userId/warn` - Issue warning
- `PATCH /api/admin/users/:userId/status` - Update user status
- `GET /api/admin/reports` - List file reports
- `PATCH /api/admin/reports/:reportId` - Update report status
- `GET /api/admin/audit-logs` - View audit logs
- `GET /api/admin/settings` - Get system settings
- `PATCH /api/admin/settings` - Update settings

## Database Schema

### Tables
- **users** - User accounts and profiles
- **files** - Uploaded files metadata
- **file_reports** - User reports on files
- **user_warnings** - Warnings and suspensions
- **audit_logs** - Admin action logs
- **refresh_tokens** - Session tokens
- **system_settings** - Application configuration

## Background Jobs

### File Expiration (Hourly)
- Marks files as expired when expiration date passes
- Updates file status to unavailable

### File Cleanup (Every 12 hours)
- Permanently deletes files after retention period
- Removes from S3 storage
- Updates user storage calculations

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ CAPTCHA protection (Turnstile)
- ✅ Rate limiting on auth endpoints
- ✅ File upload validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (Helmet.js)
- ✅ CORS configuration
- ✅ Secure cookie handling
- ✅ Audit logging

## Deployment

### Production Checklist
- [ ] Set strong JWT secrets
- [ ] Configure PostgreSQL with backups
- [ ] Set up Redis persistence
- [ ] Configure S3 bucket with encryption
- [ ] Enable HTTPS/SSL
- [ ] Set up email service (SMTP)
- [ ] Configure Turnstile CAPTCHA
- [ ] Set appropriate environment variables
- [ ] Enable database connection pooling
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CDN for file delivery

### Docker Compose Deployment

```bash
# Production mode
DOCKER_BUILDKIT=1 docker-compose -f docker-compose.yml up -d
```

## Development Commands

**Backend**
```bash
cd backend
npm run dev        # Start dev server
npm run build      # Build TypeScript
npm run migrate    # Run migrations
npm run seed       # Seed database
npm run lint       # Run linter
npm run typecheck  # Type checking
```

**Frontend**
```bash
cd frontend
npm run dev        # Start dev server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run linter
```

## Testing

### Admin Credentials (Default)
- Email: `admin@filehost.local`
- Password: `Admin123!@#`

### Test User Flow
1. Register new account
2. Upload file
3. Set expiration and sharing
4. Copy sharing link
5. Access public file
6. Download and track

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL connection
psql -h localhost -U filehost -d filehost

# Run migrations manually
cd backend && npm run migrate
```

### Redis Connection Issues
```bash
# Test Redis
redis-cli ping

# Check Redis status
redis-cli info
```

### File Upload Issues
```bash
# Check MinIO
curl http://localhost:9000

# Check bucket
minio/mc ls minio/filehost
```

## Performance Optimization

- Implement CDN for static assets
- Add caching headers for file downloads
- Use database connection pooling
- Optimize database indexes
- Implement file compression
- Cache API responses with Redis
- Use file streaming for large downloads

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

## Roadmap

- [ ] OAuth integration (Google, GitHub)
- [ ] Two-factor authentication (2FA)
- [ ] File encryption at rest
- [ ] Advanced search and filtering
- [ ] Collaborative file folders
- [ ] File versioning
- [ ] API keys for programmatic access
- [ ] Bandwidth throttling
- [ ] Advanced analytics
- [ ] Mobile app

---

**Built with ❤️ by TXRS Zone**
