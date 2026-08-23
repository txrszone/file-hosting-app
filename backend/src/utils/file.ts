import crypto from 'crypto';

export const generatePublicLink = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

export const sanitizeFilename = (filename: string): string => {
  // Remove path separators and special characters
  return filename
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .substring(0, 255);
};

export const generateStorageKey = (userId: string, filename: string, fileId: string): string => {
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(filename);
  return `files/${userId}/${fileId}/${timestamp}-${sanitized}`;
};

export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export const isImageFile = (mimeType: string): boolean => {
  return /^image\/(jpeg|png|gif|webp|svg\+xml)$/.test(mimeType);
};

export const isPdfFile = (mimeType: string): boolean => {
  return mimeType === 'application/pdf';
};

export const isVideoFile = (mimeType: string): boolean => {
  return /^video\/(mp4|webm|quicktime|x-msvideo)$/.test(mimeType);
};

export const isAudioFile = (mimeType: string): boolean => {
  return /^audio\/(mpeg|wav|ogg|webm|flac)$/.test(mimeType);
};

export const isTextFile = (mimeType: string): boolean => {
  return /^text\//.test(mimeType) || mimeType === 'application/json';
};

export const canPreview = (mimeType: string): boolean => {
  return (
    isImageFile(mimeType) ||
    isPdfFile(mimeType) ||
    isVideoFile(mimeType) ||
    isAudioFile(mimeType) ||
    isTextFile(mimeType)
  );
};
