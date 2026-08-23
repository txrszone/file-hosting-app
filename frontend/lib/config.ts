export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export const FILE_SIZE_LIMITS = {
  max: 5 * 1024 * 1024 * 1024, // 5GB
};

export const EXPIRATION_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '1d', label: '1 Day' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'unlimited', label: 'Never Expire' },
  { value: 'custom', label: 'Custom Date' },
];
