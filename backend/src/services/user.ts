import { query } from '../db/pool';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash?: string;
  google_id?: string;
  role: string;
  status: string;
  storage_used: number;
  warning_count: number;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export const createUser = async (
  email: string,
  username: string,
  passwordHash: string,
  googleId?: string
): Promise<User> => {
  const res = await query(
    `INSERT INTO users (email, username, password_hash, google_id, role, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [email, username, passwordHash, googleId || null, 'user', 'active']
  );
  return res.rows[0];
};

export const getUserById = async (id: string): Promise<User | null> => {
  const res = await query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0] || null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const res = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return res.rows[0] || null;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const res = await query('SELECT * FROM users WHERE username = $1', [username]);
  return res.rows[0] || null;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  const keys = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

  const res = await query(
    `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id]
  );
  return res.rows[0];
};

export const updateUserRole = async (userId: string, newRole: string): Promise<User> => {
  return updateUser(userId, { role: newRole });
};

export const updateUserStatus = async (userId: string, status: string): Promise<User> => {
  return updateUser(userId, { status });
};

export const updateStorageUsed = async (userId: string, bytesChange: number): Promise<void> => {
  await query(
    `UPDATE users SET storage_used = storage_used + $1 WHERE id = $2`,
    [bytesChange, userId]
  );
};

export const getAllUsers = async (limit: number = 50, offset: number = 0): Promise<User[]> => {
  const res = await query(
    `SELECT id, email, username, role, status, storage_used, warning_count, last_login, created_at, updated_at 
     FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
};

export const searchUsers = async (searchTerm: string, limit: number = 50): Promise<User[]> => {
  const res = await query(
    `SELECT id, email, username, role, status, storage_used, warning_count, last_login, created_at, updated_at 
     FROM users 
     WHERE email ILIKE $1 OR username ILIKE $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [`%${searchTerm}%`, limit]
  );
  return res.rows;
};
