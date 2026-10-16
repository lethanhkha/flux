import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redis } from '../config/redis';
import { AppError } from './error.middleware';

const LOAD_TEST_SECRET = process.env.LOAD_TEST_SECRET || 'flux-load-test-secret-2026';

// In-memory rate limiting store fallback
interface InMemoryRateRecord {
  count: number;
  resetAt: number;
}
const memoryRateStore = new Map<string, InMemoryRateRecord>();

// Clean up stale memory records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryRateStore.entries()) {
    if (record.resetAt <= now) {
      memoryRateStore.delete(key);
    }
  }
}, 30000).unref();

/**
 * User-Aware Distributed Rate Limiter
 * - Bypasses rate limiting for authorized load testing via X-Flux-Load-Test header
 * - Uses userId for authenticated requests (up to maxRequests/window)
 * - Falls back to client IP for unauthenticated requests
 * - Falls back to in-memory store if Redis is unavailable
 */
export const createRateLimiter = (
  prefix: string,
  maxRequests: number,
  windowSeconds: number
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // 1. Bypass check for load testing
      const loadTestHeader = req.headers['x-flux-load-test'];
      if (loadTestHeader === LOAD_TEST_SECRET) {
        return next();
      }

      // 2. Determine target identifier (userId if authenticated, else IP)
      let identifier = req.user?.userId;

      if (!identifier && req.headers.authorization?.startsWith('Bearer ')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.decode(token) as { sub?: string } | null;
          if (decoded?.sub) {
            identifier = decoded.sub;
          }
        } catch {
          // Ignore decoding errors here; auth middleware handles validation
        }
      }

      if (!identifier) {
        identifier =
          (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
          req.socket.remoteAddress ||
          'unknown_ip';
      }

      const key = `ratelimit:${prefix}:${identifier}`;

      // 3. Try Redis if ready
      if (redis.status === 'ready') {
        const current = await redis.incr(key);

        if (current === 1) {
          await redis.expire(key, windowSeconds);
        }

        if (current > maxRequests) {
          const ttl = await redis.ttl(key);
          throw new AppError(
            `Bạn đang gửi yêu cầu quá nhanh. Vui lòng thử lại sau ${ttl > 0 ? ttl : windowSeconds} giây.`,
            429
          );
        }

        return next();
      }

      // 4. In-Memory fallback rate limiter
      const now = Date.now();
      const record = memoryRateStore.get(key);

      if (!record || record.resetAt <= now) {
        memoryRateStore.set(key, {
          count: 1,
          resetAt: now + windowSeconds * 1000,
        });
        return next();
      }

      record.count += 1;
      if (record.count > maxRequests) {
        const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
        throw new AppError(
          `Bạn đang gửi yêu cầu quá nhanh. Vui lòng thử lại sau ${waitSeconds} giây.`,
          429
        );
      }

      next();
    } catch (err: any) {
      if (err.statusCode === 429) {
        return next(err);
      }
      // Fail open so legitimate users are not blocked by rate-limiter infrastructure errors
      next();
    }
  };
};
