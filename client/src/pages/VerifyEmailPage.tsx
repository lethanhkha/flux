import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Mail, CheckCircle2, ArrowRight, RefreshCw, Edit2, Check, ExternalLink } from 'lucide-react';
import { apiClient, getErrorMessage } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
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
        const res = await verifyEmail(targetEmail, codeToSubmit);
        setIsSuccess(true);
        toast.success(res.message || 'Kích hoạt tài khoản thành công!');

        // Automatically navigate to dashboard after a short pleasant delay
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
    [verifyEmail, navigate]
  );

  // Auto verify if query code was present in URL link
  useEffect(() => {
    if (queryCode && queryEmail) {
      if (queryCode.length === 6 && /^\d+$/.test(queryCode)) {
        setDigits(queryCode.split(''));
        submitCode(queryEmail, queryCode);
      }
    }
  }, [queryCode, queryEmail, submitCode]);

  const handleResend = async () => {
    if (!email) {
      toast.error('Vui lòng nhập địa chỉ Gmail để gửi lại mã.');
      return;
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      toast.error('Hệ thống chỉ hỗ trợ địa chỉ Gmail (@gmail.com).');
      return;
    }

    if (cooldown > 0) {
      toast.info(`Vui lòng chờ ${cooldown} giây trước khi gửi lại.`);
      return;
    }

    setIsResending(true);
    setErrorMsg(null);

    try {
      await apiClient.post('/auth/resend-verification', { email });
      setCooldown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.success('Mã kích hoạt 6 chữ số mới đã được gửi vào hộp thư Gmail của bạn!');
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Không thể gửi lại mã kích hoạt.');
      toast.error(msg);
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-brand selection:text-white page-enter">
      {/* Header */}
      <header className="py-6 px-4 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-brand flex items-center justify-center text-white shadow-sm shadow-brand/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand to-indigo-600 bg-clip-text text-transparent">
            Flux
          </span>
        </Link>
        <Link to="/login" className="text-xs text-slate-500 hover:text-brand font-semibold">
          Quay lại Đăng nhập
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 text-center">
            {isSuccess ? (
              <div className="space-y-4 py-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight">Kích hoạt tài khoản thành công!</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Tài khoản của bạn đã được xác thực an toàn. Đang tự động chuyển hướng vào không gian làm việc...
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-md shadow-brand/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Vào Bảng Điều Khiển Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="h-14 w-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto shadow-sm">
                  <Mail className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight">Xác thực Email</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Mã xác thực gồm 6 chữ số đã được gửi đến hộp thư Gmail của bạn. Vui lòng kiểm tra email và nhập mã vào bên dưới.
                  </p>
                </div>

                {/* Email Display & Inline Editor */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs">
                  {isEditingEmail ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        placeholder="ten_cua_ban@gmail.com"
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveEmail}
                        className="px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Lưu</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-400">Gửi đến:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate font-mono">
                          {email || 'Chưa có email'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewEmailInput(email);
                          setIsEditingEmail(true);
                        }}
                        className="text-brand hover:underline font-medium text-[11px] flex items-center gap-1 ml-2 flex-shrink-0 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors shadow-2xs"
                  >
                    <span>Mở hộp thư Gmail</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium text-center">
                    {errorMsg}
                  </div>
                )}

                {/* 6-Digit OTP Box Grid */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitCode(email, digits.join(''));
                  }}
                  className="space-y-5"
                >
                  <div
                    className="flex items-center justify-center gap-2 sm:gap-3"
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
                        className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand shadow-sm transition-all"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying || digits.join('').length !== 6}
                    className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-md shadow-brand/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isVerifying ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang xác thực...</span>
                      </div>
                    ) : (
                      <>
                        <span>Xác Nhận Kích Hoạt</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Resend Cooldown Section */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Chưa nhận được email?</span>
                  {cooldown > 0 ? (
                    <span className="text-slate-400 font-medium">
                      Gửi lại sau <strong className="font-mono text-slate-600 dark:text-slate-300">{cooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="text-brand font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                      <span>{isResending ? 'Đang gửi...' : 'Gửi lại mã OTP'}</span>
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
