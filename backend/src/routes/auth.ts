import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { generateTokens, setTokenCookies, clearTokenCookies } from '../utils/token';
import { createUser, getUserByEmail, updateUser } from '../services/user';
import { verifyTurnstile } from '../utils/captcha';
import { logAudit } from '../services/admin';
import { query } from '../db/pool';

const router = Router();

// Register
router.post('/register', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email, username, password, captchaToken } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password required' });
    }

    // Verify CAPTCHA
    if (!await verifyTurnstile(captchaToken)) {
      return res.status(400).json({ error: 'CAPTCHA verification failed' });
    }

    // Check if user exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await createUser(email, username, passwordHash);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, username: user.username },
      accessToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, captchaToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Verify CAPTCHA
    if (!await verifyTurnstile(captchaToken)) {
      return res.status(400).json({ error: 'CAPTCHA verification failed' });
    }

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check status
    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Account is banned' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash || '');
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await updateUser(user.id, { last_login: new Date() });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await query('SELECT id, email, username, role, status, storage_used, warning_count, created_at FROM users WHERE id = $1', [
      req.user?.id,
    ]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Logout
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Delete refresh tokens
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user?.id]);

    clearTokenCookies(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Refresh token
router.post('/refresh', async (req: AuthRequest, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const tokenRes = await query('SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP', [
      refreshToken,
    ]);

    if (tokenRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const tokenRecord = tokenRes.rows[0];
    const userRes = await query('SELECT id, email, role FROM users WHERE id = $1', [tokenRecord.user_id]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Delete old token and create new
    await query('DELETE FROM refresh_tokens WHERE id = $1', [tokenRecord.id]);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );

    setTokenCookies(res, accessToken, newRefreshToken);

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

export default router;
