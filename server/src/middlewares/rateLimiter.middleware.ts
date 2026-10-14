import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { AppError } from './error.middleware';

/**
 * Distributed Rate Limiter backed by Redis
 * @param prefix Namespace for rate limiting (e.g. 'auth', 'general')
 * @param maxRequests Maximum requests allowed within window
 * @param windowSeconds Window size in seconds
 */
export const createRateLimiter = (
  prefix: string,
  maxRequests: number,
  windowSeconds: number
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        'unknown_ip';

      const key = `ratelimit:${prefix}:${clientIp}`;

      // Increment hit counter in Redis
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > maxRequests) {
        const ttl = await redis.ttl(key);
        throw new AppError(
          `Too many requests. Please try again in ${ttl > 0 ? ttl : windowSeconds} seconds.`,
          429
        );
      }

      next();
    } catch (err: any) {
      if (err.statusCode === 429) {
        return next(err);
      }
      // If redis is unavailable, fail open so legitimate traffic is not blocked
      next();
    }
  };
};
