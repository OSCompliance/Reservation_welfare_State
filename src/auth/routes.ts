// Auth API Routes

import { Hono } from 'hono';
import { createAuthManager } from './auth';

interface Env {
  AUTH_SECRET?: string;
}

export function createAuthRoutes(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();

  /**
   * POST /api/auth/login
   * Generate token for demo/test users
   */
  router.post('/login', async (c) => {
    try {
      const { email } = await c.req.json();

      if (!email) {
        return c.json({ error: 'email is required' }, 400);
      }

      // Validate test user emails
      const testUsers: Record<string, string> = {
        'admin@muslim-welfare.test': 'admin',
        'enumerator@muslim-welfare.test': 'enumerator',
        'viewer@muslim-welfare.test': 'viewer',
      };

      const role = testUsers[email];
      if (!role) {
        return c.json({
          error: 'Invalid credentials. Use test email addresses.',
          test_users: Object.keys(testUsers),
        }, 401);
      }

      const authManager = createAuthManager(c.env.AUTH_SECRET);
      const userId = `${role}-${Date.now()}`;
      const token = authManager.generateToken(userId, email);

      return c.json({
        success: true,
        user: {
          id: userId,
          email,
          role,
        },
        token,
        expires_in_hours: 24,
      });
    } catch (error) {
      return c.json({ error: `Login failed: ${String(error)}` }, 500);
    }
  });

  /**
   * POST /api/auth/verify
   * Verify token validity
   */
  router.post('/verify', async (c) => {
    try {
      const { token } = await c.req.json();

      if (!token) {
        return c.json({ error: 'token is required' }, 400);
      }

      const authManager = createAuthManager(c.env.AUTH_SECRET);
      const result = authManager.verifyToken(token);

      if (!result.valid) {
        return c.json({
          valid: false,
          error: result.error,
        }, 401);
      }

      return c.json({
        valid: true,
        userId: result.userId,
        email: result.email,
      });
    } catch (error) {
      return c.json({ error: `Verification failed: ${String(error)}` }, 500);
    }
  });

  /**
   * GET /api/auth/test-users
   * Get test credentials for demo
   */
  router.get('/test-users', (c) => {
    const authManager = createAuthManager(c.env.AUTH_SECRET);
    const testUsers = authManager.createTestUsers();

    return c.json({
      available_users: testUsers.map((u) => ({
        email: u.email,
        role: u.role,
        token: u.token,
      })),
      note: 'These are test credentials for development/testing only',
    });
  });

  /**
   * GET /api/auth/status
   * Check auth system status
   */
  router.get('/status', (c) => {
    return c.json({
      status: 'operational',
      auth_type: 'token-based',
      token_expiry_hours: 24,
      endpoints: {
        login: 'POST /api/auth/login',
        verify: 'POST /api/auth/verify',
        test_users: 'GET /api/auth/test-users',
      },
    });
  });

  return router;
}
