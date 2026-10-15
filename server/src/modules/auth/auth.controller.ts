import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  enable2FASchema,
  disable2FASchema,
  verify2FASchema,
} from './auth.schema';
import { env } from '../../config';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: `${env.API_PREFIX}/auth`,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await authService.register(validated);
      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = verifyEmailSchema.parse(req.body);
      const result = await authService.verifyEmail(validated);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = resendVerificationSchema.parse(req.body);
      const result = await authService.resendVerification(validated.email);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await authService.login(validated);

      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      }

      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async verify2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = verify2FASchema.parse(req.body);
      const result = await authService.verify2FALogin(
        validated.tempToken,
        validated.code,
        validated.backupCode
      );

      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      }

      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      const result = await authService.refreshSession(token);

      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      const result = await authService.logout(req.user!.userId, accessToken, refreshToken);
      res.clearCookie('refreshToken', { path: COOKIE_OPTIONS.path });
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async setup2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.setup2FA(req.user!.userId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async enable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = enable2FASchema.parse(req.body);
      const result = await authService.enable2FA(req.user!.userId, validated);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async disable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = disable2FASchema.parse(req.body);
      const result = await authService.disable2FA(req.user!.userId, validated.password);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(validated.email);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(validated);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = changePasswordSchema.parse(req.body);
      const result = await authService.changePassword(req.user!.userId, validated);
      res.clearCookie('refreshToken', { path: COOKIE_OPTIONS.path });
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.getMe(req.user!.userId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
