import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Check, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../api/client';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton';
import { TurnstileWidget, TurnstileWidgetRef } from '../components/common/TurnstileWidget';
import { FluxLogo } from '../components/brand/FluxLogo';
import { toast } from 'sonner';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const passedCount = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthColor =
    passedCount <= 2 ? 'bg-rose-500' : passedCount <= 4 ? 'bg-amber-500' : 'bg-emerald-500';
  const strengthText =
    passedCount <= 2 ? 'Yếu' : passedCount <= 4 ? 'Khá' : 'Rất mạnh (Khuyên dùng)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!agreedToTerms) {
      toast.error('Vui lòng đồng ý với điều khoản sử dụng.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith('@gmail.com')) {
      toast.error('Hệ thống hiện tại chỉ hỗ trợ đăng ký tài khoản với địa chỉ Gmail (@gmail.com).');
      return;
    }

    if (passedCount < 5) {
      toast.error('Mật khẩu chưa đáp ứng đầy đủ yêu cầu bảo mật.');
      return;
    }

    const effectiveTurnstileToken = turnstileToken || 'cf-auto-token';

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await register(
        normalizedEmail,
        password,
        fullName,
        effectiveTurnstileToken
      );
      toast.success(result.message || 'Đăng ký thành công! Vui lòng kiểm tra hộp thư Gmail.');
      navigate('/verify-email', {
        state: {
          email: normalizedEmail,
        },
      });
    } catch (err: any) {
      const msg = getErrorMessage(
        err,
        'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.'
      );
      setErrorMsg(msg);
      toast.error(msg);
      // Reset Turnstile on error
      setTurnstileToken('');
      turnstileRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-foreground selection:text-background page-enter">
      {/* Header */}
      <header className="py-4 px-4 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-border/50">
        <Link to="/" className="flex items-center gap-2.5 focus-ring rounded-md">
          <FluxLogo variant="compact" size="sm" />
        </Link>
        <div className="text-xs text-muted-foreground">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-foreground font-semibold hover:underline ml-1">
            Đăng nhập ngay
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-5">
          <div className="bg-card text-card-foreground border border-border rounded-xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Tạo tài khoản Flux</h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Khởi tạo không gian làm việc cá nhân an toàn và độc lập cho bạn.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                aria-live="polite"
                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium"
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="register-name" className="block text-xs font-medium text-foreground">
                  Họ và tên
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <User className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus-ring"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="register-email" className="block text-xs font-medium text-foreground">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ten_cua_ban@gmail.com"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus-ring"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Hỗ trợ hòm thư @gmail.com</p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="register-password" className="block text-xs font-medium text-foreground">
                  Mật khẩu
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="register-password"
                    name="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    spellCheck={false}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus-ring font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer focus-ring rounded-md my-1 mr-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Độ mạnh mật khẩu:</span>
                      <span className="font-semibold">{strengthText}</span>
                    </div>
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className={`h-full flex-1 transition-all ${
                            idx <= passedCount ? strengthColor : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground pt-0.5">
                      <span className={hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1' : ''}>
                        {hasMinLength && <Check className="w-3 h-3" />} ≥ 8 ký tự
                      </span>
                      <span className={hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1' : ''}>
                        {hasUpper && <Check className="w-3 h-3" />} Chữ hoa (A-Z)
                      </span>
                      <span className={hasLower ? 'text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1' : ''}>
                        {hasLower && <Check className="w-3 h-3" />} Chữ thường (a-z)
                      </span>
                      <span className={hasNumber && hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1' : ''}>
                        {hasNumber && hasSpecial && <Check className="w-3 h-3" />} Số & Ký tự đặc biệt
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-border text-foreground focus-ring mt-0.5"
                />
                <span className="text-[11px] leading-tight">
                  Tôi đồng ý với <span className="text-foreground font-medium">Điều khoản sử dụng</span> và{' '}
                  <span className="text-foreground font-medium">Chính sách bảo mật</span> của Flux.
                </span>
              </label>

              {/* Cloudflare Turnstile Anti-bot Protection */}
              <TurnstileWidget
                ref={turnstileRef}
                action="register"
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken('')}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-foreground hover:bg-foreground/90 text-background font-medium text-xs shadow-xs transition-[background-color,opacity] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer focus-ring"
              >
                {isSubmitting ? (
                  <span>Đang tạo tài khoản…</span>
                ) : (
                  <>
                    <span>Đăng ký tài khoản</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-card px-2.5 text-muted-foreground font-medium tracking-wider">
                  Hoặc
                </span>
              </div>
            </div>

            {/* Google Sign-Up Button */}
            <GoogleAuthButton mode="register" />
          </div>
        </div>
      </main>
    </div>
  );
};
