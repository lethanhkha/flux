import { Request, Response, NextFunction } from 'express';
import { turnstileService } from '../services/turnstile.service';
import { AppError } from './error.middleware';

/**
 * Middleware: Enforce Cloudflare Turnstile token verification
 * Protects against automated bots and brute-force attacks on sensitive auth routes
 */
export const requireTurnstile = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!turnstileService.isEnabled()) {
    return next();
  }

  // 1. Extract Turnstile token from body or headers
  const token =
    req.body?.turnstileToken ||
    req.body?.['cf-turnstile-response'] ||
    (req.headers['cf-turnstile-response'] as string) ||
    (req.headers['x-turnstile-token'] as string);

  if (!token) {
    return next(
      new AppError(
        'Vui lòng hoàn tất xác minh bảo mật chống bot trước khi tiếp tục.',
        400
      )
    );
  }

  // 2. Extract Client IP
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = typeof forwardedFor === 'string'
    ? forwardedFor.split(',')[0].trim()
    : req.socket.remoteAddress;

  // 3. Verify with Cloudflare Siteverify API
  const result = await turnstileService.verifyToken(token, clientIp);

  if (!result.success) {
    console.warn(`⚠️ [Turnstile] Bot verification failed for IP ${clientIp}:`, result.errorCodes);
    return next(
      new AppError(
        'Xác minh bảo mật chống bot không thành công. Vui lòng tải lại và thử lại.',
        403
      )
    );
  }

  next();
};
