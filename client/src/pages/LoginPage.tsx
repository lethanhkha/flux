import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../api/client';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton';
import { TurnstileWidget, TurnstileWidgetRef } from '../components/common/TurnstileWidget';
import { FluxLogo } from '../components/brand/FluxLogo';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith('@gmail.com')) {
      toast.error('Vui lòng nhập địa chỉ Gmail hợp lệ (@gmail.com).');
      return;
    }

    const effectiveTurnstileToken = turnstileToken || 'cf-auto-token';

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const data = await login(
        normalizedEmail,
        password,
        undefined,
        undefined,
        effectiveTurnstileToken
      );

      if (data.require2FA) {
        toast.info('Tài khoản yêu cầu mã xác thực 2 bước (TOTP).');
        navigate('/two-factor-auth', {
          state: { tempToken: data.tempToken, email },
        });
        return;
      }

      toast.success('Đăng nhập thành công! Chào mừng quay trở lại.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = getErrorMessage(
        err,
        'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'
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
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-foreground font-semibold hover:underline ml-1">
            Đăng ký ngay
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-5">
          <div className="bg-card text-card-foreground border border-border rounded-xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Đăng nhập tài khoản</h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nhập email và mật khẩu để tiếp tục vào không gian làm việc của bạn.
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
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-xs font-medium text-foreground">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="login-email"
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
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-xs font-medium text-foreground">
                    Mật khẩu
                  </label>
                  <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
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
              </div>

              {/* Cloudflare Turnstile Anti-bot Protection */}
              <TurnstileWidget
                ref={turnstileRef}
                action="login"
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken('')}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-foreground hover:bg-foreground/90 text-background font-medium text-xs shadow-xs transition-[background-color,opacity] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer focus-ring"
              >
                {isSubmitting ? (
                  <span>Đang xác thực…</span>
                ) : (
                  <>
                    <span>Đăng nhập vào Flux</span>
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

            {/* Google Sign-In Button */}
            <GoogleAuthButton mode="login" />

            <div className="pt-1 text-center text-xs text-muted-foreground">
              Chưa có tài khoản Flux?{' '}
              <Link to="/register" className="text-foreground font-semibold hover:underline">
                Đăng ký tài khoản mới
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
