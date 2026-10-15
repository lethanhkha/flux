import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const primaryMsg = err.errors[0]?.message || 'Dữ liệu đầu vào không hợp lệ.';
    return res.status(400).json({
      success: false,
      message: primaryMsg,
      error: {
        code: 'VALIDATION_ERROR',
        message: primaryMsg,
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // 2. Operational App Errors (Controlled exceptions)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: 'APPLICATION_ERROR',
        message: err.message,
      },
    });
  }

  // 3. Unhandled Server Errors (Production Error Masking)
  console.error('💥 Unhandled Exception:', err);

  const isDev = env.NODE_ENV === 'development';
  const defaultMsg = 'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau.';
  return res.status(500).json({
    success: false,
    message: isDev ? err.message : defaultMsg,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDev ? err.message : defaultMsg,
      ...(isDev && { stack: err.stack }),
    },
  });
};
