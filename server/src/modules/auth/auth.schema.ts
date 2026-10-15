import { z } from 'zod';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email('Địa chỉ email không hợp lệ')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Mật khẩu là bắt buộc' })
    .regex(
      passwordPattern,
      'Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
    ),
  fullName: z
    .string({ required_error: 'Họ và tên là bắt buộc' })
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được vượt quá 100 ký tự')
    .trim(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email('Địa chỉ email không hợp lệ')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Mật khẩu là bắt buộc' }),
  totpCode: z
    .string()
    .length(6, 'Mã 2FA phải gồm đúng 6 chữ số')
    .optional(),
  backupCode: z
    .string()
    .min(6, 'Mã dự phòng không hợp lệ')
    .max(16, 'Mã dự phòng không hợp lệ')
    .optional(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  token: z.string().min(10, 'Mã xác thực không hợp lệ'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  token: z.string().min(10, 'Mã khôi phục không hợp lệ'),
  newPassword: z
    .string()
    .regex(
      passwordPattern,
      'Mật khẩu mới phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
    ),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
  newPassword: z
    .string()
    .regex(
      passwordPattern,
      'Mật khẩu mới phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
    ),
});

export const verify2FASchema = z.object({
  tempToken: z.string().min(10, 'Phiên xác thực 2FA không hợp lệ'),
  code: z.string().optional(),
  backupCode: z.string().optional(),
});

export const enable2FASchema = z.object({
  secret: z.string().min(16, 'Secret 2FA không hợp lệ'),
  code: z.string().length(6, 'Mã OTP gồm 6 chữ số'),
});

export const disable2FASchema = z.object({
  password: z.string().min(1, 'Mật khẩu là bắt buộc để xác nhận hủy 2FA'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type Verify2FAInput = z.infer<typeof verify2FASchema>;
export type Enable2FAInput = z.infer<typeof enable2FASchema>;
export type Disable2FAInput = z.infer<typeof disable2FASchema>;
