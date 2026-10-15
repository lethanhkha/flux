import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config';

class MailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    // 1. Direct Gmail Configuration (Preferred for user)
    const gmailUser = env.GMAIL_USER || (env.SMTP_USER.endsWith('@gmail.com') ? env.SMTP_USER : '');
    const gmailPass = env.GMAIL_APP_PASSWORD || env.SMTP_PASS;

    if (gmailUser && gmailPass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });
      this.isConfigured = true;
      console.log(`📧 [MailService] Configured with Gmail SMTP account: ${gmailUser}`);
      return;
    }

    // 2. Generic SMTP Configuration
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      this.isConfigured = true;
      console.log(`📧 [MailService] Configured with custom SMTP host: ${env.SMTP_HOST}`);
      return;
    }

    // 3. Fallback: Simulation mode for local dev until user provides Gmail credentials
    console.warn(
      '⚠️ [MailService] GMAIL_USER / GMAIL_APP_PASSWORD not configured. Emails will be logged to console.'
    );
    this.isConfigured = false;
  }

  /**
   * Send 6-digit numeric OTP to user's Gmail mailbox
   */
  async sendOtpEmail(toEmail: string, otpCode: string, fullName?: string): Promise<boolean> {
    const sender = env.GMAIL_USER || env.SMTP_FROM || 'Flux Workspace <no-reply@flux.workspace>';
    const recipientName = fullName || 'bạn';

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mã kích hoạt tài khoản Flux</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560px" style="max-width: 560px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Flux Workspace</h1>
              <p style="margin: 6px 0 0 0; color: #e0e7ff; font-size: 14px;">Không gian làm việc cá nhân & tài chính thông minh</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 19px; font-weight: 700; color: #0f172a;">Kích hoạt tài khoản của bạn</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Xin chào <strong>${recipientName}</strong>,<br>
                Cảm ơn bạn đã đăng ký tài khoản tại Flux. Dưới đây là mã xác thực 6 chữ số dùng để kích hoạt tài khoản của bạn:
              </p>

              <!-- OTP Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #f1f5f9; border: 2px dashed #6366f1; border-radius: 16px; padding: 18px 32px; text-align: center;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #4338ca;">
                        ${otpCode}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                ⏰ Mã kích hoạt có hiệu lực trong vòng <strong>10 phút</strong>.<br>
                🔒 Vì lý do an toàn, tuyệt đối không chia sẻ mã này cho bất kỳ ai.
              </p>

              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0;" />

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8;">
                Nếu bạn không thực hiện đăng ký tài khoản này, vui lòng bỏ qua email hoặc thông báo cho chúng tôi để được hỗ trợ.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © 2026 Flux Workspace. Tất cả các quyền được bảo lưu.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // If configured with real SMTP, send it
    if (this.isConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: sender,
          to: toEmail,
          subject: `${otpCode} là mã kích hoạt tài khoản Flux của bạn`,
          text: `Mã kích hoạt Flux của bạn là: ${otpCode}. Mã có hiệu lực trong 10 phút.`,
          html: htmlContent,
        });
        console.log(`✅ [MailService] Email sent successfully to ${toEmail}: ${info.messageId}`);
        return true;
      } catch (err: any) {
        console.error(`❌ [MailService] Failed to send email to ${toEmail}:`, err.message);
        // Fallback to console so user can still see it if SMTP failed
        this.logConsoleOtp(toEmail, otpCode);
        return false;
      }
    }

    // Simulation / Local Dev Fallback (Always logs clearly to console)
    this.logConsoleOtp(toEmail, otpCode);
    return true;
  }

  private logConsoleOtp(toEmail: string, otpCode: string) {
    console.log('\n======================================================');
    console.log(`📩 [GMAIL OTP SIMULATION] Gửi tới: ${toEmail}`);
    console.log(`🔢 MÃ XÁC THỰC 6 SỐ: [ ${otpCode} ] (Hiệu lực 10 phút)`);
    console.log('💡 Để gửi mail thật: Cung cấp GMAIL_USER và GMAIL_APP_PASSWORD trong file .env');
    console.log('======================================================\n');
  }
}

export const mailService = new MailService();
