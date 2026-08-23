import { Router, Response } from 'express';
import { getFileByPublicLink } from '../services/file';
import { getSignedUrl } from '../services/storage';
import { canPreview } from '../utils/file';

const router = Router();

// Get public file info
router.get('/:publicLink', async (req: Response) => {
  try {
    const file = await getFileByPublicLink(req.params.publicLink);

    if (!file) {
      return res.status(404).json({ error: 'File not found or expired' });
    }

    res.json({
      id: file.id,
      name: file.name,
      originalName: file.original_name,
      size: file.size,
      mimeType: file.mime_type,
      downloadCount: file.download_count,
      canPreview: canPreview(file.mime_type),
      createdAt: file.created_at,
      expiresAt: file.expires_at,
    });
  } catch (error) {
    console.error('Get public file error:', error);
    res.status(500).json({ error: 'Failed to get file information' });
  }
});

// Download public file
router.get('/:publicLink/download', async (req: Response) => {
  try {
    const file = await getFileByPublicLink(req.params.publicLink);

    if (!file) {
      return res.status(404).json({ error: 'File not found or expired' });
    }

    // Generate signed URL
    const signedUrl = getSignedUrl(file.storage_key, 3600);

    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Download public file error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

export default router;
