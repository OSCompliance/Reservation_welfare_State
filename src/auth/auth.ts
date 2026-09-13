// Simple authentication system

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'enumerator' | 'viewer';
  token: string;
  created_at: string;
  expires_at: string;
}

export interface AuthConfig {
  secret: string;
  tokenExpiry: number; // in hours
}

export class AuthManager {
  private secret: string;
  private tokenExpiry: number;

  constructor(config: AuthConfig) {
    this.secret = config.secret || 'default-secret-key-change-me';
    this.tokenExpiry = config.tokenExpiry || 24;
  }

  /**
   * Simple hash function (not cryptographically secure, for demo only)
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Generate a user token
   */
  generateToken(userId: string, email: string): string {
    const payload = {
      userId,
      email,
      timestamp: Date.now(),
    };

    const tokenStr = JSON.stringify(payload);
    const encodedToken = btoa(tokenStr);
    const signature = this.simpleHash(encodedToken + this.secret);

    return `${encodedToken}.${signature}`;
  }

  /**
   * Verify token
   */
  verifyToken(token: string): { valid: boolean; userId?: string; email?: string; error?: string } {
    try {
      const [payload, signature] = token.split('.');

      if (!payload || !signature) {
        return { valid: false, error: 'Invalid token format' };
      }

      const expectedSignature = this.simpleHash(payload + this.secret);

      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid token signature' };
      }

      const decoded = JSON.parse(atob(payload));

      const now = Date.now();
      const expiryTime = decoded.timestamp + this.tokenExpiry * 60 * 60 * 1000;

      if (now > expiryTime) {
        return { valid: false, error: 'Token expired' };
      }

      return {
        valid: true,
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  /**
   * Create test users for demo
   */
  createTestUsers(): User[] {
    return [
      {
        id: 'admin-001',
        email: 'admin@muslim-welfare.test',
        role: 'admin',
        token: this.generateToken('admin-001', 'admin@muslim-welfare.test'),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'enum-001',
        email: 'enumerator@muslim-welfare.test',
        role: 'enumerator',
        token: this.generateToken('enum-001', 'enumerator@muslim-welfare.test'),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'viewer-001',
        email: 'viewer@muslim-welfare.test',
        role: 'viewer',
        token: this.generateToken('viewer-001', 'viewer@muslim-welfare.test'),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
}

export function createAuthManager(secret?: string): AuthManager {
  return new AuthManager({
    secret: secret || 'default-secret-key-welfare-system',
    tokenExpiry: 24,
  });
}
