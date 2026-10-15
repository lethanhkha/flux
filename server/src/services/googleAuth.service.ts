import { env } from '../config';
import { AppError } from '../middlewares/error.middleware';

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

class GoogleAuthService {
  /**
   * Check if Google OAuth credentials are provided
   */
  isConfigured(): boolean {
    return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  }

  /**
   * Generate Google OAuth2 Authorization URL
   */
  getAuthorizationUrl(): string {
    if (!this.isConfigured()) {
      // In dev mode without credentials, point to a local mock handler
      return `${env.API_PREFIX}/auth/google/mock`;
    }

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange Google authorization code for user profile
   */
  async getProfileFromCode(code: string): Promise<GoogleUserProfile> {
    if (!this.isConfigured()) {
      throw new AppError(
        'Google OAuth chưa được cấu hình. Vui lòng thêm GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET vào file .env',
        500
      );
    }

    try {
      // 1. Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: env.GOOGLE_CALLBACK_URL,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        console.error('❌ Google Token Exchange Error:', errorData);
        throw new AppError('Không thể xác thực với Google. Mã ủy quyền không hợp lệ hoặc đã hết hạn.', 400);
      }

      const tokenData = (await tokenResponse.json()) as {
        access_token: string;
        id_token?: string;
      };

      // 2. Fetch User Profile using access token
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new AppError('Không thể lấy thông tin tài khoản từ Google.', 400);
      }

      const userData = (await userResponse.json()) as {
        email: string;
        name: string;
        picture?: string;
        sub: string;
        email_verified?: boolean;
      };

      if (!userData.email) {
        throw new AppError('Tài khoản Google không cung cấp địa chỉ email.', 400);
      }

      return {
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        picture: userData.picture,
        sub: userData.sub,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      console.error('❌ Google OAuth Network Error:', err);
      throw new AppError('Có lỗi xảy ra khi kết nối đến dịch vụ Google.', 500);
    }
  }

  /**
   * Verify and extract user profile from Google ID Token / Credential (e.g. Google One-Tap)
   */
  async getProfileFromIdToken(idToken: string): Promise<GoogleUserProfile> {
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
      );

      if (!response.ok) {
        throw new AppError('Mã xác thực Google (ID Token) không hợp lệ.', 400);
      }

      const payload = (await response.json()) as {
        email: string;
        name: string;
        picture?: string;
        sub: string;
        aud?: string;
      };

      if (!payload.email) {
        throw new AppError('Token Google không chứa thông tin email.', 400);
      }

      return {
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
        sub: payload.sub,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('Không thể xác minh thông tin Google ID Token.', 400);
    }
  }
}

export const googleAuthService = new GoogleAuthService();
