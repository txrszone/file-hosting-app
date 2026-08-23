# Secure File Hosting & Sharing Platform

A modern, secure file hosting and sharing website with advanced features for file management, expiration, reporting, and admin controls.

## Features

### User Features
- **Authentication**: Email registration/login with optional Google OAuth
- **File Management**: Upload, rename, delete, download files with progress tracking
- **Public Sharing**: Generate unique public links for each file
- **File Preview**: Support for images, PDFs, videos, audio, and text files
- **Upload Progress**: Real-time upload progress indicators
- **File Expiration**: Choose from predefined or custom expiration dates (1h, 1d, 7d, 30d, custom, unlimited)
- **File Metadata**: Display size, type, upload date, and download count

### Admin Features
- Comprehensive dashboard with statistics
- User management (warnings, suspension, banning, role assignment)
- File moderation and management
- Report handling system
- Audit logging for all admin actions
- System settings management
- Expired file retention area (7-day retention before permanent deletion)

### Security
- Server-side authentication and authorization
- Role-based access control (User, Moderator, Admin)
- Secure object storage integration (AWS S3)
- Signed/temporary download URLs
- File type and MIME validation
- Filename sanitization
- Rate limiting and abuse protection
- CAPTCHA/Turnstile integration
- Malware scanning architecture ready
- Secure API endpoints with authorization
- JWT authentication with refresh tokens
- Encrypted sensitive data

## Tech Stack

### Frontend
- React 18 with TypeScript
- Next.js 14 (App Router)
- Tailwind CSS
- React Query / TanStack Query
- Zustand (state management)
- Axios (HTTP client)

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL (database)
- AWS S3 (object storage)
- JWT authentication
- bcrypt (password hashing)
- Bull (job queue for file expiration)

### Infrastructure
- Docker & Docker Compose
- PostgreSQL
- Redis (for caching and job queues)

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- AWS S3 credentials (or S3-compatible service)

### Installation

```bash
# Clone repository
git clone https://github.com/txrszone/file-hosting-app.git
cd file-hosting-app

# Setup environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Start with Docker
docker-compose up
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost:3000/admin-panel
- **MinIO Console**: http://localhost:9001 (credentials: minioadmin/minioadmin)
- **MailHog**: http://localhost:8025

## Security

- ✅ Server-side authentication & authorization
- ✅ Role-based access control (RBAC)
- ✅ Secure file validation and storage
- ✅ Rate limiting on all endpoints
- ✅ CAPTCHA protection on forms
- ✅ Comprehensive audit logging
- ✅ Automatic file expiration & cleanup
- ✅ No secrets in frontend code

## License

MIT

## Support

For issues, create a GitHub issue in this repository.