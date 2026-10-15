import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '../../config/prisma';
import { env } from '../../config';
import { AppError } from '../../middlewares/error.middleware';
import { mailService } from '../../services/mail.service';
import { sessionStore } from './sessionStore';
import {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResetPasswordInput,
  ChangePasswordInput,
  Enable2FAInput,
} from './auth.schema';

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
}

export class AuthService {
  /**
   * Helper to format safe user profile for client
   */
  private formatUser(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
    };
  }

  /**
   * Generate HMAC signature for email token (Verification / Reset)
   */
  private generateHmacToken(payload: string, expiresInMs = 15 * 60 * 1000): string {
    const expiresAt = Date.now() + expiresInMs;
    const data = `${payload}:${expiresAt}`;
    const hmac = crypto.createHmac('sha256', env.JWT_ACCESS_SECRET).update(data).digest('hex');
    return Buffer.from(`${expiresAt}:${hmac}`).toString('base64url');
  }

  /**
   * Verify HMAC signature for email token
   */
  private verifyHmacToken(payload: string, rawToken: string): boolean {
    try {
      const decoded = Buffer.from(rawToken, 'base64url').toString('utf-8');
      const [expiresAtStr, signature] = decoded.split(':');
      const expiresAt = parseInt(expiresAtStr, 10);

      if (isNaN(expiresAt) || Date.now() > expiresAt) {
        return false;
      }

      const expectedData = `${payload}:${expiresAt}`;
      const expectedSignature = crypto
        .createHmac('sha256', env.JWT_ACCESS_SECRET)
        .update(expectedData)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Issue Dual JWT Access Token + Refresh Token
   */
  private async issueTokens(user: { id: string; email: string }) {
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any }
    );

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const familyId = crypto.randomUUID();

    // Store refresh token in SessionStore (RTR enabled)
    await sessionStore.saveRefreshToken(user.id, refreshToken, familyId);

    return { accessToken, refreshToken };
  }

  /**
   * 1. Register a new user with Argon2id password hashing
   */
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new AppError('Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.', 409);
    }

    // Hash password with Argon2id
    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });

    // Create user and default primary wallet in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          fullName: input.fullName,
          isEmailVerified: false,
        },
      });

      // Default primary cash wallet
      await tx.wallet.create({
        data: {
          userId: user.id,
          name: 'Ví tiền mặt chính',
          currency: 'VND',
          initialBalance: 0,
          currentBalance: 0,
          icon: 'wallet',
          color: '#6366F1',
        },
      });

      return user;
    });

    // Generate secure 6-digit numeric OTP (10 mins TTL) and save to sessionStore
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    await sessionStore.saveEmailOtp(newUser.email, otpCode, 10 * 60);

    // Send 6-digit OTP directly to user's Gmail inbox
    await mailService.sendOtpEmail(newUser.email, otpCode, newUser.fullName);

    return {
      user: this.formatUser(newUser),
      message: 'Đăng ký thành công! Mã xác thực 6 số đã được gửi đến hộp thư Gmail của bạn. Vui lòng kiểm tra email.',
    };
  }

  /**
   * 2. Verify email address via 6-digit OTP code (or fallback signed token)
   */
  async verifyEmail(input: VerifyEmailInput) {
    const rawCode = input.code || input.token;
    if (!rawCode) {
      throw new AppError('Mã xác thực kích hoạt là bắt buộc.', 400);
    }

    const trimmedCode = rawCode.trim();
    const is6DigitOtp = /^\d{6}$/.test(trimmedCode);

    if (is6DigitOtp) {
      const otpCheck = await sessionStore.verifyEmailOtp(input.email, trimmedCode);
      if (!otpCheck.valid) {
        if (otpCheck.reason === 'MAX_ATTEMPTS') {
          throw new AppError(
            'Bạn đã nhập sai mã kích hoạt quá 5 lần. Vui lòng bấm gửi lại mã mới.',
            400
          );
        }
        if (otpCheck.reason === 'EXPIRED') {
          throw new AppError(
            'Mã xác thực đã hết hạn hoặc không tồn tại. Vui lòng gửi lại mã mới.',
            400
          );
        }
        const remainingText =
          otpCheck.remainingAttempts !== undefined
            ? ` (Còn lại ${otpCheck.remainingAttempts} lần thử)`
            : '';
        throw new AppError(`Mã xác thực không chính xác${remainingText}. Vui lòng kiểm tra lại.`, 400);
      }
    } else {
      // Legacy HMAC token check
      const isValid = this.verifyHmacToken(input.email, trimmedCode);
      if (!isValid) {
        throw new AppError('Mã xác thực không hợp lệ hoặc đã hết hạn (15 phút).', 400);
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new AppError('Không tìm thấy tài khoản người dùng.', 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    // Auto-login: Issue Dual JWT tokens (Access + Refresh with RTR)
    const tokens = await this.issueTokens(updatedUser);

    return {
      user: this.formatUser(updatedUser),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'Kích hoạt tài khoản thành công! Chào mừng bạn đến với Flux.',
    };
  }

  /**
   * 3. Resend email verification 6-digit OTP
   */
  async resendVerification(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Anti-enumeration: return friendly message even if user not found
    if (!user || user.isEmailVerified) {
      return {
        message: 'Nếu tài khoản tồn tại và chưa xác thực, mã kích hoạt mới đã được gửi.',
      };
    }

    // Rate-limit check (60-second cooldown)
    const cooldown = await sessionStore.canResendEmailOtp(user.email);
    if (!cooldown.allowed) {
      throw new AppError(
        `Vui lòng chờ ${cooldown.remainingSeconds} giây trước khi yêu cầu gửi lại mã mới.`,
        429
      );
    }

    // Generate new 6-digit numeric OTP (10 mins TTL)
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    await sessionStore.saveEmailOtp(user.email, otpCode, 10 * 60);

    // Send 6-digit OTP directly to user's Gmail inbox
    await mailService.sendOtpEmail(user.email, otpCode, user.fullName);

    return {
      message: 'Mã xác thực 6 số mới đã được gửi đến hộp thư Gmail của bạn.',
    };
  }

  /**
   * 4. User Login with Dual JWT, Account Lockout & 2FA support
   */
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000)
      );
      throw new AppError(
        `Tài khoản tạm thời bị khóa do nhập sai mật khẩu 5 lần. Vui lòng thử lại sau ${remainingMinutes} phút.`,
        423
      );
    }

    // Verify Argon2id password
    const isPasswordValid = await argon2.verify(user.passwordHash, input.password);

    if (!isPasswordValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (failedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock 15 minutes
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil,
        },
      });

      if (lockedUntil) {
        throw new AppError(
          'Mật khẩu không đúng. Bạn đã nhập sai 5 lần, tài khoản bị tạm khóa 15 phút.',
          423
        );
      }

      throw new AppError(
        `Email hoặc mật khẩu không chính xác. Còn lại ${5 - failedAttempts} lần thử.`,
        401
      );
    }

    // Password valid -> reset lockout counters
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // Check 2FA requirement
    if (user.twoFactorEnabled) {
      if (!input.totpCode && !input.backupCode) {
        // Issue temporary 2FA token (5 minutes expiry)
        const tempToken = jwt.sign(
          { sub: user.id, email: user.email, is2FA: true },
          env.JWT_ACCESS_SECRET,
          { expiresIn: '5m' }
        );

        return {
          require2FA: true,
          tempToken,
          message: 'Tài khoản yêu cầu xác thực 2 bước (TOTP).',
        };
      }

      // Check TOTP code
      let passed2FA = false;
      if (input.totpCode && user.twoFactorSecret) {
        passed2FA = authenticator.check(input.totpCode, user.twoFactorSecret);
      }

      // Or check backup code
      if (!passed2FA && input.backupCode) {
        const hashedInput = crypto.createHash('sha256').update(input.backupCode.trim()).digest('hex');
        const backupCodes = (user.backupCodes as string[]) || [];

        const index = backupCodes.indexOf(hashedInput);
        if (index !== -1) {
          // Burn backup code
          backupCodes.splice(index, 1);
          await prisma.user.update({
            where: { id: user.id },
            data: { backupCodes },
          });
          passed2FA = true;
        }
      }

      if (!passed2FA) {
        throw new AppError('Mã 2FA hoặc mã dự phòng không hợp lệ.', 401);
      }
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.issueTokens(user);

    return {
      require2FA: false,
      user: this.formatUser(user),
      accessToken,
      refreshToken,
      message: 'Đăng nhập thành công!',
    };
  }

  /**
   * 5. Verify 2FA with temporary session token
   */
  async verify2FALogin(tempToken: string, code?: string, backupCode?: string) {
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, env.JWT_ACCESS_SECRET);
    } catch {
      throw new AppError('Phiên xác thực 2FA đã hết hạn. Vui lòng đăng nhập lại.', 401);
    }

    if (!decoded.is2FA || !decoded.sub) {
      throw new AppError('Token xác thực không hợp lệ.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new AppError('Tài khoản không hợp lệ hoặc chưa bật 2FA.', 401);
    }

    let passed = false;
    if (code && user.twoFactorSecret) {
      passed = authenticator.check(code, user.twoFactorSecret);
    }

    if (!passed && backupCode) {
      const hashedInput = crypto.createHash('sha256').update(backupCode.trim()).digest('hex');
      const backupCodes = (user.backupCodes as string[]) || [];
      const index = backupCodes.indexOf(hashedInput);
      if (index !== -1) {
        backupCodes.splice(index, 1);
        await prisma.user.update({
          where: { id: user.id },
          data: { backupCodes },
        });
        passed = true;
      }
    }

    if (!passed) {
      throw new AppError('Mã 2FA hoặc mã dự phòng không hợp lệ.', 401);
    }

    const { accessToken, refreshToken } = await this.issueTokens(user);

    return {
      user: this.formatUser(user),
      accessToken,
      refreshToken,
      message: 'Xác thực 2 bước thành công!',
    };
  }

  /**
   * 6. Rotate Refresh Token (RTR)
   */
  async refreshSession(oldRefreshToken: string) {
    if (!oldRefreshToken) {
      throw new AppError('Thiếu Refresh Token. Vui lòng đăng nhập lại.', 401);
    }

    const session = await sessionStore.validateAndRotateRefreshToken(oldRefreshToken);
    if (!session) {
      throw new AppError(
        'Phiên làm việc đã hết hạn hoặc token đã bị thu hồi. Vui lòng đăng nhập lại.',
        401
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      throw new AppError('Tài khoản không tồn tại.', 401);
    }

    // Issue rotated tokens
    const { accessToken, refreshToken: newRefreshToken } = await this.issueTokens(user);

    return {
      user: this.formatUser(user),
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * 7. Logout and Blacklist current Access Token
   */
  async logout(userId: string, accessToken?: string, refreshToken?: string) {
    if (accessToken) {
      try {
        const decoded: any = jwt.decode(accessToken);
        if (decoded && decoded.exp) {
          const remainingSeconds = Math.max(0, Math.floor(decoded.exp - Date.now() / 1000));
          await sessionStore.blacklistAccessToken(accessToken, remainingSeconds || 15 * 60);
        }
      } catch {
        await sessionStore.blacklistAccessToken(accessToken, 15 * 60);
      }
    }

    if (refreshToken) {
      await sessionStore.validateAndRotateRefreshToken(refreshToken);
    }

    return { message: 'Đăng xuất thành công.' };
  }

  /**
   * 8. Setup 2FA (Generate secret, OTP Auth URI & QR Code)
   */
  async setup2FA(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('Tài khoản không tồn tại.', 404);
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'Flux Workspace', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      secret,
      otpauthUrl,
      qrCodeUrl,
    };
  }

  /**
   * 9. Enable 2FA with verification and 8 SHA-256 backup codes
   */
  async enable2FA(userId: string, input: Enable2FAInput) {
    const isCodeValid = authenticator.check(input.code, input.secret);
    if (!isCodeValid) {
      throw new AppError('Mã OTP 6 chữ số không chính xác.', 400);
    }

    // Generate 8 alphanumeric one-time backup codes
    const plainBackupCodes: string[] = [];
    const hashedBackupCodes: string[] = [];

    for (let i = 0; i < 8; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars (e.g. A3F82C9D)
      plainBackupCodes.push(code);
      hashedBackupCodes.push(crypto.createHash('sha256').update(code).digest('hex'));
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: input.secret,
        backupCodes: hashedBackupCodes,
      },
    });

    return {
      message: 'Kích hoạt xác thực 2 bước (2FA) thành công!',
      backupCodes: plainBackupCodes,
    };
  }

  /**
   * 10. Disable 2FA
   */
  async disable2FA(userId: string, passwordConfirm: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('Tài khoản không tồn tại.', 404);
    }

    const isMatch = await argon2.verify(user.passwordHash, passwordConfirm);
    if (!isMatch) {
      throw new AppError('Mật khẩu xác nhận không chính xác.', 401);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: [],
      },
    });

    return { message: 'Đã tắt xác thực 2 bước thành công.' };
  }

  /**
   * 11. Forgot Password (generate signed reset token)
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Anti-enumeration
    if (!user) {
      return {
        message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.',
      };
    }

    const resetToken = this.generateHmacToken(user.email, 15 * 60 * 1000);

    return {
      resetToken,
      message: 'Liên kết đặt lại mật khẩu đã được tạo thành công (thời hạn 15 phút).',
    };
  }

  /**
   * 12. Reset Password
   */
  async resetPassword(input: ResetPasswordInput) {
    const isValid = this.verifyHmacToken(input.email, input.token);
    if (!isValid) {
      throw new AppError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 400);
    }

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new AppError('Tài khoản không tồn tại.', 404);
    }

    const passwordHash = await argon2.hash(input.newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Revoke all existing sessions for security
    await sessionStore.revokeAllUserSessions(user.id);

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới.' };
  }

  /**
   * 13. Change Password
   */
  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('Tài khoản không tồn tại.', 404);
    }

    const isMatch = await argon2.verify(user.passwordHash, input.currentPassword);
    if (!isMatch) {
      throw new AppError('Mật khẩu hiện tại không chính xác.', 401);
    }

    const passwordHash = await argon2.hash(input.newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke sessions
    await sessionStore.revokeAllUserSessions(userId);

    return { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  /**
   * 14. Get Current User Profile (/me)
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: {
          select: {
            id: true,
            name: true,
            currency: true,
            currentBalance: true,
            icon: true,
            color: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Tài khoản không tồn tại.', 404);
    }

    return {
      ...this.formatUser(user),
      wallets: user.wallets,
    };
  }

  /**
   * 15. Google OAuth2 Login or Registration
   */
  async loginOrRegisterWithGoogle(profile: {
    email: string;
    name: string;
    picture?: string;
    sub: string;
  }) {
    const normalizedEmail = profile.email.toLowerCase().trim();

    // Enforce our project's Gmail requirement
    if (!normalizedEmail.endsWith('@gmail.com')) {
      throw new AppError(
        'Hệ thống hiện tại chỉ hỗ trợ đăng nhập với tài khoản Gmail (@gmail.com).',
        400
      );
    }

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // User exists -> update avatar & mark isEmailVerified if needed
      const updateData: any = {};
      if (!user.isEmailVerified) {
        updateData.isEmailVerified = true;
      }
      if (!user.avatarUrl && profile.picture) {
        updateData.avatarUrl = profile.picture;
      }
      if (user.failedLoginAttempts > 0 || user.lockedUntil) {
        updateData.failedLoginAttempts = 0;
        updateData.lockedUntil = null;
      }

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    } else {
      // New User -> Create User with verified email and default wallet in a transaction
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await argon2.hash(randomPassword, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });

      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            fullName: profile.name || normalizedEmail.split('@')[0],
            avatarUrl: profile.picture || null,
            passwordHash,
            isEmailVerified: true,
          },
        });

        // Create default primary wallet
        await tx.wallet.create({
          data: {
            userId: newUser.id,
            name: 'Ví tiền mặt chính',
            currency: 'VND',
            initialBalance: 0,
            currentBalance: 0,
            icon: 'wallet',
            color: '#6366F1',
          },
        });

        return newUser;
      });
    }

    // Issue Dual JWT + RTR Refresh token
    const tokens = await this.issueTokens(user);

    return {
      user: this.formatUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'Đăng nhập thành công với tài khoản Google!',
    };
  }
}

export const authService = new AuthService();
