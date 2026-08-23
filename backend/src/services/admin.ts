import { query } from '../db/pool';

export interface UserWarning {
  id: string;
  user_id: string;
  issued_by: string;
  reason: string;
  severity: string;
  expires_at?: Date;
  created_at: Date;
}

export const issueWarning = async (
  userId: string,
  issuedBy: string,
  reason: string,
  severity: string = 'warning'
): Promise<UserWarning> => {
  let expiresAt = null;
  if (severity === 'suspension') {
    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  const res = await query(
    `INSERT INTO user_warnings (user_id, issued_by, reason, severity, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, issuedBy, reason, severity, expiresAt]
  );

  // Increment warning count
  await query('UPDATE users SET warning_count = warning_count + 1 WHERE id = $1', [userId]);

  return res.rows[0];
};

export const getUserWarnings = async (userId: string): Promise<UserWarning[]> => {
  const res = await query(
    'SELECT * FROM user_warnings WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return res.rows;
};

export const getActiveWarnings = async (userId: string): Promise<UserWarning[]> => {
  const res = await query(
    `SELECT * FROM user_warnings 
     WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
     ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows;
};

export const logAudit = async (
  adminId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  changes?: any,
  ipAddress?: string
): Promise<void> => {
  await query(
    `INSERT INTO audit_logs (admin_id, action, resource_type, resource_id, changes, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [adminId, action, resourceType, resourceId, JSON.stringify(changes || {}), ipAddress || null]
  );
};

export const getAuditLogs = async (limit: number = 100, offset: number = 0): Promise<any[]> => {
  const res = await query(
    `SELECT al.*, u.email as admin_email FROM audit_logs al
     LEFT JOIN users u ON al.admin_id = u.id
     ORDER BY al.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
};
