import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config';
import { sessionStore } from '../modules/auth/sessionStore';
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
      throw new AppError('Yêu cầu đăng nhập. Vui lòng đăng nhập để tiếp tục.', 401);
    }

    const token = authHeader.split(' ')[1];

    // Check Blacklist (for logged-out or revoked tokens)
    const isBlacklisted = await sessionStore.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new AppError('Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.', 401);
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
      return next(new AppError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Mã xác thực không hợp lệ. Vui lòng đăng nhập lại.', 401));
    }
    next(error);
  }
};
