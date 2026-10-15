import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { createRateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();

// Rate limiter for sensitive auth operations (10 requests per minute)
const authLimiter = createRateLimiter('auth_shield', 10, 60);

// Public Auth Endpoints
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/verify-2fa', authLimiter, authController.verify2FA);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authLimiter, authController.resendVerification);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Google OAuth2 Endpoints
router.get('/google/url', authController.getGoogleAuthUrl);
router.get('/google/callback', authController.googleCallback);
router.post('/google', authLimiter, authController.googleLoginApi);
router.get('/google/mock', authController.googleMockLogin);

// Protected Auth Endpoints (require valid JWT Access Token)
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/2fa/setup', authenticate, authController.setup2FA);
router.post('/2fa/enable', authenticate, authController.enable2FA);
router.post('/2fa/disable', authenticate, authController.disable2FA);

export default router;
