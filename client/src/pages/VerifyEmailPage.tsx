import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight, RefreshCw, Edit2, Check, ExternalLink } from 'lucide-react';
import { apiClient, getErrorMessage } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { FluxLogo } from '../components/brand/FluxLogo';
import { toast } from 'sonner';

export const VerifyEmailPage: React.FC = () => {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const queryEmail = searchParams.get('email') || '';
  const queryCode = searchParams.get('code') || searchParams.get('token') || '';
  const stateEmail = location.state?.email || '';

  const [email, setEmail] = useState(queryEmail || stateEmail || '');
  const [isEditingEmail, setIsEditingEmail] = useState(!email);
  const [newEmailInput, setNewEmailInput] = useState(email);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(stateEmail ? 60 : 0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (email && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [email]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    setErrorMsg(null);

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    // Auto advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto trigger submission if all 6 digits are filled
    const fullCode = newDigits.join('');
    if (value && index === 5 && fullCode.length === 6) {
      submitCode(email, fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const arr = pasted.split('');
      setDigits(arr);
      inputRefs.current[5]?.focus();
      submitCode(email, pasted);
    }
  };

  const submitCode = useCallback(
    async (targetEmail: string, codeToSubmit: string) => {
      if (isVerifying) return;
      if (!targetEmail) {
        toast.error('Vui lòng nhập địa chỉ Gmail của bạn.');
        return;
      }

      if (!targetEmail.toLowerCase().endsWith('@gmail.com')) {
        toast.error('Hệ thống hiện tại chỉ hỗ trợ địa chỉ Gmail (@gmail.com).');
        return;
      }

      if (!codeToSubmit || codeToSubmit.length !== 6) {
        toast.error('Vui lòng nhập đủ 6 chữ số mã xác thực từ email.');
        return;
      }

      setIsVerifying(true);
      setErrorMsg(null);

      try {
        await verifyEmail(targetEmail, codeToSubmit);
        setIsSuccess(true);
        toast.success('Xác thực tài khoản thành công!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } catch (err: any) {
        const msg = getErrorMessage(
          err,
          'Mã xác thực không hợp lệ hoặc đã hết hạn.'
        );
        setErrorMsg(msg);
        toast.error(msg);
      } finally {
        setIsVerifying(false);
      }
    },
    [isVerifying, verifyEmail, navigate]
  );

  // Auto trigger verification if email & code were present in URL search params
  useEffect(() => {
    if (queryEmail && queryCode && queryCode.length === 6) {
      const arr = queryCode.split('').slice(0, 6);
      setDigits(arr);
      submitCode(queryEmail, queryCode);
    }
  }, [queryEmail, queryCode, submitCode]);

  const handleResend = async () => {
    if (isResending || cooldown > 0) return;
    if (!email) {
      toast.error('Vui lòng nhập email trước khi gửi lại mã.');
      return;
    }

    setIsResending(true);
    try {
      await apiClient.post('/auth/resend-verification', { email });
      toast.success('Mã OTP xác thực mới đã được gửi vào Gmail của bạn!');
      setCooldown(60);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể gửi lại mã xác thực.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleSaveEmail = () => {
    const trimmed = newEmailInput.trim().toLowerCase();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      toast.error('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (!trimmed.endsWith('@gmail.com')) {
      toast.error('Hệ thống hiện tại chỉ hỗ trợ địa chỉ Gmail (@gmail.com).');
      return;
    }

    setEmail(trimmed);
    setIsEditingEmail(false);
    toast.success('Đã cập nhật email nhận mã kích hoạt.');
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-foreground selection:text-background page-enter">
      {/* Header */}
      <header className="py-4 px-4 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-border/50">
        <Link to="/" className="flex items-center gap-2.5 focus-ring rounded-md">
          <FluxLogo variant="compact" size="sm" />
        </Link>
        <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground font-medium">
          Quay lại đăng nhập
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-5">
          <div className="bg-card text-card-foreground border border-border rounded-xl p-6 sm:p-7 shadow-sm space-y-5 text-center">
            {isSuccess ? (
              <div className="space-y-4 py-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">Kích hoạt tài khoản thành công!</h1>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Tài khoản đã được xác thực an toàn. Đang chuyển hướng vào không gian làm việc…
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-2.5 rounded-lg bg-foreground hover:bg-foreground/90 text-background font-medium text-xs shadow-xs transition-[background-color,opacity] flex items-center justify-center gap-2 cursor-pointer focus-ring"
                  >
                    <span>Vào bảng điều khiển ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="h-10 w-10 rounded-lg bg-muted text-foreground flex items-center justify-center mx-auto border border-border">
                  <Mail className="w-5 h-5" aria-hidden="true" />
                </div>

                <div className="space-y-1">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">Xác thực Email</h1>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Mã xác thực gồm 6 chữ số đã được gửi đến Gmail của bạn. Vui lòng kiểm tra và nhập mã bên dưới.
                  </p>
                </div>

                {/* Email Display & Inline Editor */}
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                  {isEditingEmail ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        spellCheck={false}
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        placeholder="ten_cua_ban@gmail.com"
                        className="flex-1 px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground text-xs focus-ring"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveEmail}
                        className="px-2.5 py-1.5 rounded-md bg-foreground text-background font-medium text-xs flex items-center gap-1 cursor-pointer focus-ring"
                      >
                        <Check className="w-3 h-3" aria-hidden="true" />
                        <span>Lưu</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-muted-foreground">Gửi đến:</span>
                        <span className="font-semibold text-foreground truncate font-mono">
                          {email || 'Chưa có email'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewEmailInput(email);
                          setIsEditingEmail(true);
                        }}
                        className="text-foreground hover:underline font-medium text-[11px] flex items-center gap-1 ml-2 flex-shrink-0 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" aria-hidden="true" />
                        <span>Đổi email</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Open Gmail Mailbox Quick Link */}
                <div className="flex items-center justify-center">
                  <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors"
                  >
                    <span>Mở hộp thư Gmail</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                  </a>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium text-center"
                  >
                    {errorMsg}
                  </div>
                )}

                {/* 6-Digit OTP Box Grid */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitCode(email, digits.join(''));
                  }}
                  className="space-y-4"
                >
                  <div
                    className="flex items-center justify-center gap-2"
                    onPaste={handlePaste}
                  >
                    {digits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        aria-label={`Chữ số mã xác thực thứ ${idx + 1}`}
                        className="w-10 h-12 text-center text-lg font-bold font-mono rounded-lg border border-border bg-background text-foreground focus-ring tabular-nums"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying || digits.join('').length !== 6}
                    className="w-full py-2.5 rounded-lg bg-foreground hover:bg-foreground/90 text-background font-medium text-xs shadow-xs transition-[background-color,opacity] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-ring"
                  >
                    {isVerifying ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        <span>Đang xác thực…</span>
                      </div>
                    ) : (
                      <>
                        <span>Xác nhận kích hoạt</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>

                {/* Resend Cooldown Section */}
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Chưa nhận được email?</span>
                  {cooldown > 0 ? (
                    <span className="text-muted-foreground font-medium">
                      Gửi lại sau <strong className="font-mono text-foreground">{cooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="text-foreground font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} aria-hidden="true" />
                      <span>{isResending ? 'Đang gửi…' : 'Gửi lại mã OTP'}</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
