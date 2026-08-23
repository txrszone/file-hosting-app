# Deploy to Render

## Prerequisites
1. [Render.com](https://render.com) account (free tier available)
2. GitHub repository connected to Render
3. AWS S3 bucket or MinIO instance (for file storage)
4. Environment variables configured

## Deployment Steps

### Option 1: Using Render Dashboard (Recommended for beginners)

#### Step 1: Connect GitHub Repository
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Select "Build and deploy from a Git repository"
4. Connect your GitHub account
5. Select the `file-hosting-app` repository

#### Step 2: Deploy Backend
1. Click "New" → "Web Service"
2. Configure:
   - **Name**: `filehost-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm run start`
   - **Plan**: Free (or Starter for production)

3. Click "Create Web Service"

#### Step 3: Add Environment Variables (Backend)
In Render Dashboard:
1. Go to `filehost-backend` service
2. Click "Environment"
3. Add variables:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=<generate-secure-random-value>
REFRESH_TOKEN_SECRET=<generate-secure-random-value>
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Database
DATABASE_URL=<from-PostgreSQL-service>

# Redis
REDIS_URL=<from-Redis-service>

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_S3_BUCKET=filehost
AWS_S3_ENDPOINT=https://s3.amazonaws.com

# CAPTCHA
TURNSTILE_SECRET_KEY=<your-turnstile-secret>

# Admin
ADMIN_EMAIL=admin@filehost.local
ADMIN_PASSWORD=<secure-password>

# Frontend URL
FRONTEND_URL=https://your-frontend.onrender.com
```

#### Step 4: Create PostgreSQL Database
1. Click "New" → "PostgreSQL"
2. Configure:
   - **Name**: `filehost-db`
   - **Region**: Same as backend
   - **Plan**: Free (or Starter for production)
3. Click "Create Database"
4. Copy the connection string to backend environment

#### Step 5: Create Redis Cache
1. Click "New" → "Redis"
2. Configure:
   - **Name**: `filehost-redis`
   - **Region**: Same as backend
   - **Plan**: Free (or Starter for production)
3. Click "Create Redis"
4. Copy the connection string to backend environment

#### Step 6: Deploy Frontend
1. Click "New" → "Web Service"
2. Configure:
   - **Name**: `filehost-frontend`
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Start Command**: `cd frontend && npm run start`
   - **Plan**: Free (or Starter)

3. Add Environment Variables:
```
NEXT_PUBLIC_API_URL=https://filehost-backend.onrender.com
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<your-turnstile-key>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-id>
```

### Option 2: Using Infrastructure as Code (render.yaml)

1. Commit the `render.yaml` file to your repository
2. Go to Render Dashboard
3. Click "New" → "Blueprint"
4. Connect GitHub repository
5. Render automatically creates all services
6. Add environment variables as needed

## Step-by-Step Video Guide

### Backend Deployment
```bash
# Local testing before deployment
cd backend
npm install
npm run build
NODE_ENV=production npm start
```

### Frontend Deployment
```bash
# Local testing before deployment
cd frontend
npm install
npm run build
NODE_ENV=production npm start
```

## Configure AWS S3 for Production

### Option A: Use AWS S3 (Recommended)

1. Create AWS account and S3 bucket:
   - Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
   - Create bucket: `filehost-production`
   - Enable versioning (optional)
   - Block public access

2. Create IAM user:
   - Go to IAM Console
   - Create new user: `filehost-app`
   - Attach policy: `AmazonS3FullAccess`
   - Create access key

3. Add to Render environment:
   ```
   AWS_ACCESS_KEY_ID=<your-key>
   AWS_SECRET_ACCESS_KEY=<your-secret>
   AWS_S3_BUCKET=filehost-production
   AWS_S3_ENDPOINT=https://s3.amazonaws.com
   ```

### Option B: Use MinIO (Self-hosted S3)

1. Deploy MinIO service on Render
2. Or use existing MinIO instance
3. Update environment:
   ```
   AWS_S3_ENDPOINT=https://your-minio-endpoint.com
   ```

## Setup Monitoring

### Render Built-in Monitoring
1. Go to each service dashboard
2. View "Logs" tab for real-time logs
3. View "Metrics" tab for CPU, memory, bandwidth
4. Set up alerts in Settings

### Application Monitoring
```bash
# Add to backend for error tracking
npm install sentry
```

## Backup Strategy

### Database Backups
1. Render automatically backs up PostgreSQL
2. Download backups from Render Dashboard
3. For extra safety:
   ```bash
   # Manual backup
   pg_dump $DATABASE_URL > backup.sql
   ```

### File Backups
1. S3 has built-in versioning
2. Enable S3 cross-region replication
3. Use AWS Backup service

## Performance Optimization

### For Free Tier
- Add caching headers
- Optimize database queries
- Use indexes
- Implement pagination
- Compress assets

### For Paid Tier
- Use CDN (Render Pro)
- Enable Redis caching
- Database connection pooling
- Use Redis for sessions

## Troubleshooting

### Service Won't Start
```bash
# Check logs
1. Go to service dashboard
2. Click "Logs"
3. Look for error messages
4. Check environment variables
```

### Database Connection Failed
```bash
# Verify connection string
1. DATABASE_URL should start with postgresql://
2. Check password doesn't contain special characters
3. Whitelist IPs if needed
```

### Frontend Can't Connect to Backend
```bash
# Check CORS and API URL
1. Backend: FRONTEND_URL must match frontend domain
2. Frontend: NEXT_PUBLIC_API_URL must be backend domain
3. Check CORS headers in backend
```

### Files Not Uploading
```bash
# Check S3 configuration
1. AWS credentials correct
2. S3 bucket exists and is writable
3. IAM policy allows s3:PutObject
4. Check file size limits
```

## Domain Setup

### Add Custom Domain
1. Go to service settings
2. Click "Custom Domain"
3. Add your domain (e.g., `filehost.com`)
4. Update DNS records:
   ```
   CNAME: filehost.onrender.com
   ```
5. Wait for DNS propagation (up to 48 hours)

### Enable HTTPS
- Render provides free SSL/TLS
- Automatically renewed
- Enforced for all connections

## Cost Estimation (as of 2024)

### Free Tier
- 750 hours/month per service
- 0.5 GB RAM
- Shared CPU
- 100 MB database
- Perfect for testing

### Starter Plan ($7/month per service)
- Unlimited hours
- 1 GB RAM
- 0.5 CPU
- Auto-deploy on push
- Email support

### Standard Plan ($12/month per service)
- Same as Starter
- 2 GB RAM
- 1 CPU
- Priority support

**Estimated Monthly Cost**
- Backend: $12
- Frontend: $12
- PostgreSQL: $15 (Starter)
- Redis: $5 (Starter)
- **Total: ~$44/month**

## Production Checklist

- [ ] Generate strong JWT secrets
- [ ] Configure CAPTCHA (Turnstile or reCAPTCHA)
- [ ] Set up AWS S3 bucket
- [ ] Configure email service (optional)
- [ ] Set admin password securely
- [ ] Enable database backups
- [ ] Set up monitoring/alerts
- [ ] Test file upload/download
- [ ] Configure custom domain
- [ ] Enable HTTPS
- [ ] Set up CDN (optional)
- [ ] Configure rate limiting
- [ ] Test admin panel
- [ ] Load testing
- [ ] Security audit

## Deployment Script

Create `deploy.sh` for automated deployment:

```bash
#!/bin/bash

# Build backend
cd backend
npm install
npm run build
cd ..

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Push to Render
git push origin main

echo "Deployment started! Check https://dashboard.render.com"
```

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Environment Variables](https://render.com/docs/configure-environment-variables)
- [PostgreSQL on Render](https://render.com/docs/postgres)
- [Redis on Render](https://render.com/docs/redis)
- [Custom Domains](https://render.com/docs/custom-domains)
- [GitHub Deployments](https://render.com/docs/github)

## Support

If you encounter issues:
1. Check [Render Status](https://status.render.com/)
2. Review service logs
3. Check environment variables
4. Contact Render support
5. Open GitHub issue

---

**Deploy with Render in under 10 minutes!** 🚀
