import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { apiClient, getErrorMessage } from '../api/client';
import { TurnstileWidget, TurnstileWidgetRef } from '../components/common/TurnstileWidget';
import { FluxLogo } from '../components/brand/FluxLogo';
import { toast } from 'sonner';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith('@gmail.com')) {
      toast.error('Vui lòng nhập địa chỉ Gmail hợp lệ (@gmail.com).');
      return;
    }

    const effectiveTurnstileToken = turnstileToken || 'cf-auto-token';

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/auth/forgot-password', {
        email: normalizedEmail,
        turnstileToken: effectiveTurnstileToken,
      });
      toast.success(res.data.data.message || 'Mã khôi phục đã được tạo.');
      if (res.data.data.resetToken) {
        setToken(res.data.data.resetToken);
      }
      setStep('reset');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Có lỗi xảy ra khi tạo yêu cầu.'));
      setTurnstileToken('');
      turnstileRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/auth/reset-password', {
        email,
        token,
        newPassword,
      });
      toast.success(res.data.data.message || 'Đặt lại mật khẩu thành công!');
      navigate('/login');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'));
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
        <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Quay lại đăng nhập</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-5">
          <div className="bg-card text-card-foreground border border-border rounded-xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="text-center space-y-2">
              <div className="h-10 w-10 rounded-lg bg-muted text-foreground flex items-center justify-center mx-auto border border-border">
                <KeyRound className="w-5 h-5" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Khôi phục mật khẩu</h1>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {step === 'request'
                  ? 'Nhập địa chỉ Gmail của bạn để nhận mã xác thực đặt lại mật khẩu.'
                  : 'Nhập mã token đã được cấp và mật khẩu mới cho tài khoản của bạn.'}
              </p>
            </div>

            {step === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="forgot-email" className="block text-xs font-medium text-foreground">
                    Địa chỉ Gmail
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <Mail className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <input
                      id="forgot-email"
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

                {/* Cloudflare Turnstile Anti-bot Protection */}
                <TurnstileWidget
                  ref={turnstileRef}
                  action="forgot-password"
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken('')}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-lg bg-foreground hover:bg-foreground/90 text-background font-medium text-xs shadow-xs transition-[background-color,opacity] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer focus-ring"
                >
                  {isSubmitting ? (
                    <span>Đang tạo mã khôi phục…</span>
                  ) : (
                    <>
                      <span>Tạo mã khôi phục</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="reset-token" className="block text-xs font-medium text-foreground">
                    Mã Token khôi phục
                  </label>
                  <textarea
                    id="reset-token"
                    rows={2}
                    required
                    spellCheck={false}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Mã token HMAC…"
                    className="w-full p-2.5 rounded-lg border border-border bg-background font-mono text-xs focus-ring break-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reset-new-password" className="block text-xs font-medium text-foreground">
                    Mật khẩu mới (≥8 ký tự)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <input
                      id="reset-new-password"
                      type="password"
                      autoComplete="new-password"
                      spellCheck={false}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus-ring font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-lg bg-foreground hover:bg-foreground/90 text-background font-medium text-xs shadow-xs transition-[background-color,opacity] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer focus-ring"
                >
                  {isSubmitting ? (
                    <span>Đang cập nhật mật khẩu…</span>
                  ) : (
                    <>
                      <span>Cập nhật mật khẩu mới</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                  >
                    Quay lại bước nhập email
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
