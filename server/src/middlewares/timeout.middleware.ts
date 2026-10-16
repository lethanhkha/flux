import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

/**
 * Request Timeout Middleware
 * Automatically terminates hanging requests after the specified timeout duration (default: 15s)
 * Prevents socket leaks and connection pool starvation under high load.
 */
export const requestTimeout = (timeoutMs = 15000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set socket timeout
    req.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        const error = new AppError(
          'Yêu cầu quá thời gian chờ xử lý (Request Timeout). Vui lòng thử lại sau.',
          504
        );
        next(error);
      }
    });

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        const error = new AppError(
          'Hệ thống đang bận, yêu cầu bị quá hạn (Gateway Timeout).',
          504
        );
        next(error);
      }
    }, timeoutMs);

    // Clear timeout timer when response finishes or closes
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
};
