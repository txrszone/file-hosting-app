import Queue from 'bull';
import redis from 'redis';
import { query } from '../db/pool';
import { getExpiredFiles, getFilesExpiredBefore, permanentlyDeleteFile, updateFile } from '../services/file';
import { deleteFile as deleteS3File } from '../services/storage';
import { updateStorageUsed } from '../services/user';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

const expirationQueue = new Queue('file-expiration', process.env.REDIS_URL || 'redis://localhost:6379');
const cleanupQueue = new Queue('file-cleanup', process.env.REDIS_URL || 'redis://localhost:6379');

// Process expired files (move to retention area)
expirationQueue.process(async () => {
  try {
    const expiredFiles = await getExpiredFiles();

    for (const file of expiredFiles) {
      // Mark file as expired/unavailable but keep in DB for retention
      await updateFile(file.id, {
        is_public: false,
        is_deleted: true,
      });

      console.log(`✓ File ${file.id} marked as expired`);
    }
  } catch (error) {
    console.error('Error processing expired files:', error);
    throw error;
  }
});

// Clean up files after retention period
cleanupQueue.process(async () => {
  try {
    const retentionDays = parseInt(process.env.FILE_RETENTION_DAYS || '7');
    const filesToDelete = await getFilesExpiredBefore(retentionDays);

    for (const file of filesToDelete) {
      try {
        // Delete from S3
        await deleteS3File(file.storage_key);

        // Delete from database
        await permanentlyDeleteFile(file.id);

        // Update user storage
        await updateStorageUsed(file.user_id, -file.size);

        console.log(`✓ File ${file.id} permanently deleted after retention period`);
      } catch (error) {
        console.error(`Error deleting file ${file.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error cleaning up files:', error);
    throw error;
  }
});

// Add error handlers
expirationQueue.on('error', (error) => {
  console.error('File expiration queue error:', error);
});

cleanupQueue.on('error', (error) => {
  console.error('File cleanup queue error:', error);
});

// Start background jobs
export const startExpirationJobs = () => {
  // Check for expired files every hour
  expirationQueue.add({}, {
    repeat: {
      every: 60 * 60 * 1000, // 1 hour
    },
  });

  // Clean up files every 12 hours
  cleanupQueue.add({}, {
    repeat: {
      every: 12 * 60 * 60 * 1000, // 12 hours
    },
  });

  console.log('📋 Background jobs scheduled');
};

export { expirationQueue, cleanupQueue };
