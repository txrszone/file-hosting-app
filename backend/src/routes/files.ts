import { Router, Response, Request } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import { uploadFile, getSignedUrl, deleteFile as deleteS3File, getFileStream } from '../services/storage';
import { createFile, getFileById, getUserFiles, updateFile, deleteFile, getFileByPublicLink, incrementDownloadCount, reportFile, getFileReports, updateFileReportStatus } from '../services/file';
import { generatePublicLink, sanitizeFilename, generateStorageKey, canPreview } from '../utils/file';
import { updateUserRole, updateUserStatus, logAudit } from '../services/admin';
import { updateStorageUsed } from '../services/user';
import mime from 'mime-types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const ALLOWED_MIME_TYPES = (process.env.ALLOWED_MIME_TYPES || '').split(',');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5368709120'); // 5GB

// Upload file
router.post('/upload', authMiddleware, uploadLimiter, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { expiresIn } = req.body;

    // Validate file size
    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB` });
    }

    // Validate MIME type
    const mimeType = req.file.mimetype;
    if (ALLOWED_MIME_TYPES.length > 0 && !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: 'File type not allowed' });
    }

    // Generate identifiers
    const fileId = uuidv4();
    const publicLink = generatePublicLink();
    const sanitized = sanitizeFilename(req.file.originalname);
    const storageKey = generateStorageKey(req.user!.id, req.file.originalname, fileId);

    // Calculate expiration
    let expiresAt: Date | undefined;
    if (expiresIn && expiresIn !== 'unlimited') {
      const now = new Date();
      switch (expiresIn) {
        case '1h':
          expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
          break;
        case '1d':
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case '7d':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          if (new Date(expiresIn).getTime() > now.getTime()) {
            expiresAt = new Date(expiresIn);
          }
      }
    }

    // Upload to S3
    await uploadFile(storageKey, req.file.buffer, mimeType);

    // Create file record
    const file = await createFile(
      req.user!.id,
      req.file.originalname,
      sanitized,
      req.file.size,
      mimeType,
      storageKey,
      publicLink,
      expiresAt
    );

    // Update user storage
    await updateStorageUsed(req.user!.id, req.file.size);

    // Log audit
    await logAudit(req.user!.id, 'FILE_UPLOADED', 'file', file.id, { size: req.file.size }, req.ip);

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: file.id,
        name: file.name,
        originalName: file.original_name,
        size: file.size,
        mimeType: file.mime_type,
        publicLink: file.public_link,
        expiresAt: file.expires_at,
        canPreview: canPreview(file.mime_type),
        createdAt: file.created_at,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get user files
router.get('/my-files', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const files = await getUserFiles(req.user!.id, limit, offset);

    const filesList = files.map((f) => ({
      id: f.id,
      name: f.name,
      originalName: f.original_name,
      size: f.size,
      mimeType: f.mime_type,
      publicLink: f.public_link,
      isPublic: f.is_public,
      expiresAt: f.expires_at,
      downloadCount: f.download_count,
      canPreview: canPreview(f.mime_type),
      isReported: f.is_reported,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    }));

    res.json({ files: filesList });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
});

// Get file by ID (owner only)
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const file = await getFileById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: file.id,
      name: file.name,
      originalName: file.original_name,
      size: file.size,
      mimeType: file.mime_type,
      publicLink: file.public_link,
      isPublic: file.is_public,
      expiresAt: file.expires_at,
      downloadCount: file.download_count,
      canPreview: canPreview(file.mime_type),
      createdAt: file.created_at,
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// Download file (owner or public)
router.get('/:id/download', async (req: AuthRequest, res: Response) => {
  try {
    const file = await getFileById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check access
    if (!file.is_public && file.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check expiration
    if (file.expires_at && new Date(file.expires_at) < new Date()) {
      return res.status(410).json({ error: 'File has expired' });
    }

    // Increment download count
    await incrementDownloadCount(file.id);

    // Log audit if admin
    if (req.user?.id) {
      await logAudit(req.user.id, 'FILE_DOWNLOADED', 'file', file.id, {}, req.ip);
    }

    // Get signed URL
    const signedUrl = getSignedUrl(file.storage_key, 3600);
    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Update file (owner only)
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const file = await getFileById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, isPublic, expiresAt } = req.body;
    const updates: any = {};

    if (name) updates.name = sanitizeFilename(name);
    if (isPublic !== undefined) updates.is_public = isPublic;
    if (expiresAt) updates.expires_at = expiresAt;

    const updatedFile = await updateFile(file.id, updates);

    // Log audit
    await logAudit(req.user!.id, 'FILE_UPDATED', 'file', file.id, updates, req.ip);

    res.json({
      message: 'File updated',
      file: updatedFile,
    });
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Delete file (owner only)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const file = await getFileById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete from storage
    await deleteS3File(file.storage_key);

    // Mark as deleted
    await deleteFile(file.id);

    // Update user storage
    await updateStorageUsed(req.user!.id, -file.size);

    // Log audit
    await logAudit(req.user!.id, 'FILE_DELETED', 'file', file.id, {}, req.ip);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Report file
router.post('/:id/report', async (req: AuthRequest, res: Response) => {
  try {
    const file = await getFileByPublicLink(req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Report reason required' });
    }

    const reportId = await reportFile(
      file.id,
      reason,
      description,
      req.body.email || undefined,
      req.ip
    );

    res.status(201).json({
      message: 'File reported successfully',
      reportId,
    });
  } catch (error) {
    console.error('Report file error:', error);
    res.status(500).json({ error: 'Failed to report file' });
  }
});

export default router;
