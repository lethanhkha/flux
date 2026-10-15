import { env } from '../config';

export interface TurnstileVerifyResult {
  success: boolean;
  challengeTs?: string;
  hostname?: string;
  errorCodes?: string[];
  action?: string;
  cdata?: string;
}

class TurnstileService {
  private readonly siteVerifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  /**
   * Check if Cloudflare Turnstile enforcement is enabled
   */
  isEnabled(): boolean {
    return env.CLOUDFLARE_TURNSTILE_ENABLED;
  }

  /**
   * Verify Turnstile response token with Cloudflare Siteverify API
   */
  async verifyToken(token: string, remoteIp?: string): Promise<TurnstileVerifyResult> {
    if (!this.isEnabled()) {
      return { success: true };
    }

    if (!token || typeof token !== 'string' || !token.trim()) {
      return {
        success: false,
        errorCodes: ['missing-input-response'],
      };
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', env.CLOUDFLARE_TURNSTILE_SECRET_KEY);
      formData.append('response', token.trim());
      if (remoteIp) {
        formData.append('remoteip', remoteIp);
      }

      const response = await fetch(this.siteVerifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        console.error('❌ [Turnstile] Cloudflare API responded with status:', response.status);
        return {
          success: false,
          errorCodes: [`http-status-${response.status}`],
        };
      }

      const data = (await response.json()) as {
        success: boolean;
        'challenge_ts'?: string;
        hostname?: string;
        'error-codes'?: string[];
        action?: string;
        cdata?: string;
      };

      return {
        success: data.success,
        challengeTs: data.challenge_ts,
        hostname: data.hostname,
        errorCodes: data['error-codes'],
        action: data.action,
        cdata: data.cdata,
      };
    } catch (error: any) {
      console.error('❌ [Turnstile] Verification request failed:', error.message);
      // In case of network timeout/error with Cloudflare API in dev, don't block legitimate users
      return {
        success: env.NODE_ENV === 'development',
        errorCodes: ['turnstile-network-error'],
      };
    }
  }
}

export const turnstileService = new TurnstileService();
