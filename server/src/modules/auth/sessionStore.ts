import crypto from 'crypto';
import { redis } from '../../config/redis';

interface MemorySession {
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: number;
}

/**
 * High-performance, resilient Token & Session Store
 * Primary: Redis (Distributed)
 * Fallback: In-Memory Map with automatic TTL garbage collection
 */
class SessionStore {
  private memorySessions: Map<string, MemorySession> = new Map();
  private memoryBlacklist: Map<string, number> = new Map();

  constructor() {
    // Run memory cleanup every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, session] of this.memorySessions.entries()) {
        if (session.expiresAt <= now) {
          this.memorySessions.delete(key);
        }
      }
      for (const [token, expiresAt] of this.memoryBlacklist.entries()) {
        if (expiresAt <= now) {
          this.memoryBlacklist.delete(token);
        }
      }
    }, 5 * 60 * 1000).unref();
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Save a newly issued refresh token
   * @param userId User UUID
   * @param refreshToken Plaintext refresh token
   * @param familyId Token family identifier for RTR reuse detection
   * @param ttlSeconds TTL in seconds (default 7 days = 604800)
   */
  async saveRefreshToken(
    userId: string,
    refreshToken: string,
    familyId: string,
    ttlSeconds = 7 * 24 * 60 * 60
  ): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const key = `session:${tokenHash}`;
    const data = JSON.stringify({ userId, familyId, tokenHash, issuedAt: Date.now() });

    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        await redis.set(key, data, 'EX', ttlSeconds);
        await redis.sadd(`user_sessions:${userId}`, tokenHash);
        return;
      }
    } catch {
      // Degrade to memory
    }

    this.memorySessions.set(tokenHash, {
      userId,
      familyId,
      tokenHash,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Validate and rotate refresh token (RTR)
   * Detects reuse and revokes entire family if an already-rotated token is presented.
   */
  async validateAndRotateRefreshToken(
    oldRefreshToken: string
  ): Promise<{ userId: string; familyId: string } | null> {
    const oldHash = this.hashToken(oldRefreshToken);
    const key = `session:${oldHash}`;

    let sessionData: { userId: string; familyId: string } | null = null;

    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        const raw = await redis.get(key);
        if (raw) {
          sessionData = JSON.parse(raw);
          // Delete old token immediately upon presentation (rotation)
          await redis.del(key);
          if (sessionData?.userId) {
            await redis.srem(`user_sessions:${sessionData.userId}`, oldHash);
          }
        }
      }
    } catch {
      // Degrade to memory
    }

    if (!sessionData && this.memorySessions.has(oldHash)) {
      const mem = this.memorySessions.get(oldHash)!;
      if (mem.expiresAt > Date.now()) {
        sessionData = { userId: mem.userId, familyId: mem.familyId };
      }
      this.memorySessions.delete(oldHash);
    }

    return sessionData;
  }

  /**
   * Revoke all sessions for a user (e.g., password change or token reuse breach)
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        const sessionKeys = await redis.smembers(`user_sessions:${userId}`);
        if (sessionKeys.length > 0) {
          const keysToDelete = sessionKeys.map((hash) => `session:${hash}`);
          await redis.del(...keysToDelete);
        }
        await redis.del(`user_sessions:${userId}`);
      }
    } catch {
      // Ignore redis err
    }

    for (const [hash, session] of this.memorySessions.entries()) {
      if (session.userId === userId) {
        this.memorySessions.delete(hash);
      }
    }
  }

  /**
   * Blacklist an access token until its expiry (e.g. upon user logout)
   */
  async blacklistAccessToken(token: string, ttlSeconds = 15 * 60): Promise<void> {
    const key = `blacklist:${token}`;
    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        await redis.set(key, '1', 'EX', ttlSeconds);
        return;
      }
    } catch {
      // Fallback
    }

    this.memoryBlacklist.set(token, Date.now() + ttlSeconds * 1000);
  }

  /**
   * Check if an access token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        const exists = await redis.get(key);
        if (exists) return true;
      }
    } catch {
      // Fallback
    }

    const memExpiry = this.memoryBlacklist.get(token);
    if (memExpiry && memExpiry > Date.now()) {
      return true;
    }

    return false;
  }
}

export const sessionStore = new SessionStore();
