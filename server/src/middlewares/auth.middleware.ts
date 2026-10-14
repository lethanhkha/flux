import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config';
import { redis } from '../config/redis';
import { AppError } from './error.middleware';

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Missing or malformed token.', 401);
    }

    const token = authHeader.split(' ')[1];

    // Check Redis Blacklist (for logged-out or revoked tokens)
    try {
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new AppError('Token has been revoked. Please log in again.', 401);
      }
    } catch (redisErr) {
      // Degrade gracefully if redis is offline
    }

    // Verify JWT
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      sub: string;
      email: string;
    };

    req.user = {
      userId: decoded.sub,
      email: decoded.email,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired. Please refresh your session.', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid access token.', 401));
    }
    next(error);
  }
};
