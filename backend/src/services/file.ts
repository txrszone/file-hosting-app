import { query } from '../db/pool';
import { v4 as uuidv4 } from 'uuid';

export interface FileRecord {
  id: string;
  user_id: string;
  name: string;
  original_name: string;
  size: number;
  mime_type: string;
  storage_key: string;
  public_link: string;
  is_public: boolean;
  expires_at?: Date;
  download_count: number;
  is_reported: boolean;
  report_count: number;
  is_deleted: boolean;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export const createFile = async (
  userId: string,
  originalName: string,
  sanitizedName: string,
  size: number,
  mimeType: string,
  storageKey: string,
  publicLink: string,
  expiresAt?: Date
): Promise<FileRecord> => {
  const res = await query(
    `INSERT INTO files 
     (user_id, name, original_name, size, mime_type, storage_key, public_link, is_public, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [userId, sanitizedName, originalName, size, mimeType, storageKey, publicLink, true, expiresAt || null]
  );
  return res.rows[0];
};

export const getFileById = async (id: string): Promise<FileRecord | null> => {
  const res = await query('SELECT * FROM files WHERE id = $1 AND is_deleted = FALSE', [id]);
  return res.rows[0] || null;
};

export const getFileByPublicLink = async (publicLink: string): Promise<FileRecord | null> => {
  const res = await query(
    `SELECT * FROM files 
     WHERE public_link = $1 AND is_deleted = FALSE AND is_public = TRUE
     AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
    [publicLink]
  );
  return res.rows[0] || null;
};

export const getUserFiles = async (userId: string, limit: number = 100, offset: number = 0): Promise<FileRecord[]> => {
  const res = await query(
    `SELECT * FROM files WHERE user_id = $1 AND is_deleted = FALSE 
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return res.rows;
};

export const updateFile = async (fileId: string, updates: Partial<FileRecord>): Promise<FileRecord> => {
  const keys = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

  const res = await query(
    `UPDATE files SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, fileId]
  );
  return res.rows[0];
};

export const incrementDownloadCount = async (fileId: string): Promise<void> => {
  await query(
    `UPDATE files SET download_count = download_count + 1 WHERE id = $1`,
    [fileId]
  );
};

export const deleteFile = async (fileId: string): Promise<void> => {
  await query(
    `UPDATE files SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [fileId]
  );
};

export const getExpiredFiles = async (): Promise<FileRecord[]> => {
  const res = await query(
    `SELECT * FROM files 
     WHERE expires_at < CURRENT_TIMESTAMP AND is_deleted = FALSE
     ORDER BY expires_at ASC`
  );
  return res.rows;
};

export const getFilesExpiredBefore = async (days: number): Promise<FileRecord[]> => {
  const res = await query(
    `SELECT * FROM files 
     WHERE is_deleted = TRUE AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '${days} days'
     ORDER BY deleted_at ASC`
  );
  return res.rows;
};

export const permanentlyDeleteFile = async (fileId: string): Promise<void> => {
  await query('DELETE FROM files WHERE id = $1', [fileId]);
};

export const reportFile = async (
  fileId: string,
  reason: string,
  description: string,
  reporterEmail?: string,
  reporterIp?: string
): Promise<string> => {
  const res = await query(
    `INSERT INTO file_reports (file_id, reason, description, reporter_email, reporter_ip, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [fileId, reason, description, reporterEmail || null, reporterIp || null, 'pending']
  );

  // Update report count
  await query(
    `UPDATE files SET report_count = report_count + 1, is_reported = TRUE WHERE id = $1`,
    [fileId]
  );

  return res.rows[0].id;
};

export const getFileReports = async (status?: string, limit: number = 100): Promise<any[]> => {
  const whereClause = status ? 'WHERE status = $1' : '';
  const params = status ? [status, limit] : [limit];
  const paramIndex = status ? 2 : 1;

  const res = await query(
    `SELECT fr.*, f.name, f.original_name, u.email as user_email 
     FROM file_reports fr
     JOIN files f ON fr.file_id = f.id
     JOIN users u ON f.user_id = u.id
     ${whereClause}
     ORDER BY fr.created_at DESC
     LIMIT $${paramIndex}`,
    params
  );
  return res.rows;
};

export const updateFileReportStatus = async (
  reportId: string,
  status: string,
  adminNotes?: string,
  reviewedBy?: string
): Promise<void> => {
  await query(
    `UPDATE file_reports SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP 
     WHERE id = $4`,
    [status, adminNotes || null, reviewedBy || null, reportId]
  );
};
