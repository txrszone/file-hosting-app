export interface File {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  publicLink: string;
  isPublic: boolean;
  expiresAt?: Date;
  downloadCount: number;
  canPreview: boolean;
  isReported?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  storage_used: number;
  warning_count: number;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Report {
  id: string;
  file_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: Date;
}
