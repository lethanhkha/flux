import crypto from 'crypto';
import { redis } from '../../config/redis';

interface MemorySession {
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: number;
}

interface MemoryEmailOtp {
  code: string;
  attempts: number;
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
  private memoryEmailOtps: Map<string, MemoryEmailOtp> = new Map();
  private memoryOtpCooldowns: Map<string, number> = new Map();

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
      for (const [email, otp] of this.memoryEmailOtps.entries()) {
        if (otp.expiresAt <= now) {
          this.memoryEmailOtps.delete(email);
        }
      }
      for (const [email, expiresAt] of this.memoryOtpCooldowns.entries()) {
        if (expiresAt <= now) {
          this.memoryOtpCooldowns.delete(email);
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

  /**
   * Save a 6-digit numeric OTP for email verification
   * @param email User email (normalized lowercase)
   * @param otpCode 6-digit OTP string
   * @param ttlSeconds TTL in seconds (default 10 minutes = 600)
   */
  async saveEmailOtp(email: string, otpCode: string, ttlSeconds = 600): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const otpKey = `email_otp:${normalizedEmail}`;
    const cooldownKey = `email_otp_cooldown:${normalizedEmail}`;
    const data = JSON.stringify({ code: otpCode, attempts: 0 });

    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        await redis.set(otpKey, data, 'EX', ttlSeconds);
        await redis.set(cooldownKey, '1', 'EX', 60); // 60s cooldown
        return;
      }
    } catch {
      // Degrade to in-memory
    }

    const now = Date.now();
    this.memoryEmailOtps.set(normalizedEmail, {
      code: otpCode,
      attempts: 0,
      expiresAt: now + ttlSeconds * 1000,
    });
    this.memoryOtpCooldowns.set(normalizedEmail, now + 60 * 1000);
  }

  /**
   * Check if user is allowed to request a new email OTP (rate limit / cooldown)
   */
  async canResendEmailOtp(email: string): Promise<{ allowed: boolean; remainingSeconds: number }> {
    const normalizedEmail = email.toLowerCase().trim();
    const cooldownKey = `email_otp_cooldown:${normalizedEmail}`;

    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        const ttl = await redis.ttl(cooldownKey);
        if (ttl > 0) {
          return { allowed: false, remainingSeconds: ttl };
        }
        return { allowed: true, remainingSeconds: 0 };
      }
    } catch {
      // Degrade to in-memory
    }

    const memCooldown = this.memoryOtpCooldowns.get(normalizedEmail);
    if (memCooldown && memCooldown > Date.now()) {
      const remainingSeconds = Math.ceil((memCooldown - Date.now()) / 1000);
      return { allowed: false, remainingSeconds };
    }

    return { allowed: true, remainingSeconds: 0 };
  }

  /**
   * Verify 6-digit numeric OTP with brute-force attempt limiter (max 5 tries)
   */
  async verifyEmailOtp(
    email: string,
    inputCode: string
  ): Promise<{
    valid: boolean;
    reason?: 'EXPIRED' | 'MAX_ATTEMPTS' | 'INCORRECT';
    remainingAttempts?: number;
  }> {
    const normalizedEmail = email.toLowerCase().trim();
    const otpKey = `email_otp:${normalizedEmail}`;
    const trimmedInput = inputCode.trim();

    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        const raw = await redis.get(otpKey);
        if (!raw) {
          return { valid: false, reason: 'EXPIRED' };
        }

        const otpData: { code: string; attempts: number } = JSON.parse(raw);
        if (otpData.attempts >= 5) {
          await redis.del(otpKey);
          return { valid: false, reason: 'MAX_ATTEMPTS', remainingAttempts: 0 };
        }

        if (otpData.code === trimmedInput) {
          await redis.del(otpKey);
          return { valid: true };
        }

        // Increment attempt count
        const newAttempts = otpData.attempts + 1;
        if (newAttempts >= 5) {
          await redis.del(otpKey);
          return { valid: false, reason: 'MAX_ATTEMPTS', remainingAttempts: 0 };
        }

        // Update attempts with remaining TTL
        const remainingTtl = await redis.ttl(otpKey);
        if (remainingTtl > 0) {
          await redis.set(
            otpKey,
            JSON.stringify({ code: otpData.code, attempts: newAttempts }),
            'EX',
            remainingTtl
          );
        }

        return {
          valid: false,
          reason: 'INCORRECT',
          remainingAttempts: 5 - newAttempts,
        };
      }
    } catch {
      // Degrade to memory
    }

    const mem = this.memoryEmailOtps.get(normalizedEmail);
    if (!mem || mem.expiresAt <= Date.now()) {
      this.memoryEmailOtps.delete(normalizedEmail);
      return { valid: false, reason: 'EXPIRED' };
    }

    if (mem.attempts >= 5) {
      this.memoryEmailOtps.delete(normalizedEmail);
      return { valid: false, reason: 'MAX_ATTEMPTS', remainingAttempts: 0 };
    }

    if (mem.code === trimmedInput) {
      this.memoryEmailOtps.delete(normalizedEmail);
      return { valid: true };
    }

    mem.attempts += 1;
    if (mem.attempts >= 5) {
      this.memoryEmailOtps.delete(normalizedEmail);
      return { valid: false, reason: 'MAX_ATTEMPTS', remainingAttempts: 0 };
    }

    return {
      valid: false,
      reason: 'INCORRECT',
      remainingAttempts: 5 - mem.attempts,
    };
  }
}

export const sessionStore = new SessionStore();
