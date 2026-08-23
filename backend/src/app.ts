import express, { Express, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { migrate } from './db/migrate';
import seedData from './db/seed';
import { generalLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import adminRoutes from './routes/admin';
import publicRoutes from './routes/public';

import { startExpirationJobs } from './jobs/fileExpiration';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(generalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/health', (_, res: Response) => {
  res.json({ status: 'ok' });
});

// 404
app.use((_, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const start = async () => {
  try {
    console.log('🔄 Running database migrations...');
    await migrate();

    console.log('🌱 Seeding database...');
    await seedData();

    console.log('⏰ Starting file expiration jobs...');
    startExpirationJobs();

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

start();

export default app;
