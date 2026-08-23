import { Router, Response } from 'express';
import { AuthRequest, authMiddleware, adminMiddleware, moderatorMiddleware } from '../middleware/auth';
import { getUserByEmail, getAllUsers, updateUserRole, updateUserStatus, searchUsers, updateUser } from '../services/user';
import { getFileReports, updateFileReportStatus, getFileById, deleteFile } from '../services/file';
import { getAuditLogs, issueWarning, logAudit } from '../services/admin';
import { query } from '../db/pool';
import { deleteS3File } from '../services/storage';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Admin Dashboard - Statistics
router.get('/dashboard', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Total users
    const usersRes = await query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(usersRes.rows[0].total);

    // Total files
    const filesRes = await query('SELECT COUNT(*) as total, SUM(size) as total_size FROM files WHERE is_deleted = FALSE');
    const totalFiles = parseInt(filesRes.rows[0].total);
    const totalStorage = filesRes.rows[0].total_size || 0;

    // Storage used by users
    const storageRes = await query('SELECT SUM(storage_used) as total FROM users');
    const userStorageUsed = storageRes.rows[0].total || 0;

    // Pending reports
    const reportsRes = await query('SELECT COUNT(*) as total FROM file_reports WHERE status = \'pending\'');
    const pendingReports = parseInt(reportsRes.rows[0].total);

    // Active downloads (last 24h)
    const downloadsRes = await query(
      'SELECT SUM(download_count) as total FROM files WHERE is_deleted = FALSE AND created_at > CURRENT_TIMESTAMP - INTERVAL \'1 day\''
    );
    const recentDownloads = downloadsRes.rows[0].total || 0;

    res.json({
      totalUsers,
      totalFiles,
      totalStorage,
      userStorageUsed,
      pendingReports,
      recentDownloads,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// User Management - List users
router.get('/users', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;

    let users;
    if (search) {
      users = await searchUsers(search, limit);
    } else {
      users = await getAllUsers(limit, offset);
    }

    res.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// User Management - Get user details
router.get('/users/:userId', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userRes = await query(
      'SELECT id, email, username, role, status, storage_used, warning_count, last_login, created_at FROM users WHERE id = $1',
      [req.params.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];

    // Get user's files
    const filesRes = await query(
      'SELECT id, name, size, download_count, created_at FROM files WHERE user_id = $1 AND is_deleted = FALSE',
      [req.params.userId]
    );

    // Get warnings
    const warningsRes = await query(
      'SELECT * FROM user_warnings WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.userId]
    );

    res.json({
      ...user,
      files: filesRes.rows,
      warnings: warningsRes.rows,
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// User Management - Update role
router.patch('/users/:userId/role', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await updateUserRole(req.params.userId, role);

    // Log audit
    await logAudit(req.user!.id, 'USER_ROLE_CHANGED', 'user', req.params.userId, { newRole: role }, req.ip);

    res.json({ message: 'User role updated', user });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// User Management - Warn user
router.post('/users/:userId/warn', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { reason, severity } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Warning reason required' });
    }

    // Issue warning
    const warning = await issueWarning(req.params.userId, req.user!.id, reason, severity || 'warning');

    // Update status if suspension or ban
    if (severity === 'suspension') {
      await updateUserStatus(req.params.userId, 'suspended');
    } else if (severity === 'ban') {
      await updateUserStatus(req.params.userId, 'banned');
    }

    // Log audit
    await logAudit(req.user!.id, 'USER_WARNED', 'user', req.params.userId, { reason, severity }, req.ip);

    res.json({ message: 'User warned', warning });
  } catch (error) {
    console.error('Warn user error:', error);
    res.status(500).json({ error: 'Failed to warn user' });
  }
});

// User Management - Update status
router.patch('/users/:userId/status', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;

    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await updateUserStatus(req.params.userId, status);

    // Log audit
    await logAudit(req.user!.id, 'USER_STATUS_CHANGED', 'user', req.params.userId, { newStatus: status }, req.ip);

    res.json({ message: 'User status updated', user });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// File Management - Get all reported files
router.get('/reports', authMiddleware, moderatorMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string;
    const reports = await getFileReports(status);
    res.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

// File Management - Update report status
router.patch('/reports/:reportId', authMiddleware, moderatorMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, adminNotes } = req.body;

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await updateFileReportStatus(req.params.reportId, status, adminNotes, req.user!.id);

    // Log audit
    await logAudit(req.user!.id, 'REPORT_UPDATED', 'report', req.params.reportId, { status }, req.ip);

    res.json({ message: 'Report updated' });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// File Management - Delete file
router.delete('/files/:fileId', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const file = await getFileById(req.params.fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from storage
    await deleteS3File(file.storage_key);

    // Mark as deleted
    await deleteFile(file.id);

    // Log audit
    await logAudit(req.user!.id, 'FILE_DELETED_BY_ADMIN', 'file', file.id, {}, req.ip);

    res.json({ message: 'File deleted' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Audit Logs
router.get('/audit-logs', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = await getAuditLogs(limit, offset);
    res.json({ logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

// System Settings
router.get('/settings', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const settingsRes = await query('SELECT key, value FROM system_settings');
    const settings: any = {};
    settingsRes.rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update System Settings
router.patch('/settings', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { key, value } = req.body;

    await query(
      'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [key, value]
    );

    // Log audit
    await logAudit(req.user!.id, 'SETTING_UPDATED', 'setting', key, { value }, req.ip);

    res.json({ message: 'Setting updated' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
