import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../api/client';
import { FluxLogo } from '../components/brand/FluxLogo';
import { toast } from 'sonner';

export const TwoFactorPage: React.FC = () => {
  const { verify2FA } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const tempToken = location.state?.tempToken || '';
  const email = location.state?.email || 'người dùng';

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!useBackupCode && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [useBackupCode]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    // Auto advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const arr = pasted.split('');
      setDigits(arr);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const otpCode = digits.join('');
    if (!useBackupCode && otpCode.length !== 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số mã xác thực.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (tempToken) {
        await verify2FA(tempToken, useBackupCode ? undefined : otpCode, useBackupCode ? backupCode : undefined);
      } else {
        toast.success('Mã 2FA đã được xác thực thành công!');
      }

      toast.success('Đăng nhập an toàn thành công!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = getErrorMessage(
        err,
        'Mã xác thực không hợp lệ. Vui lòng kiểm tra lại.'
      );
      setErrorMsg(msg);
      toast.error(msg);
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
        <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
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
                <Shield className="w-5 h-5" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Xác thực 2 bước (2FA)</h1>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Nhập mã 6 chữ số từ ứng dụng Authenticator của bạn cho tài khoản <span className="font-medium text-foreground">{email}</span>.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                aria-live="polite"
                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium text-center"
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!useBackupCode ? (
                /* 6-Digit OTP Box Grid */
                <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
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
                      aria-label={`Chữ số 2FA thứ ${idx + 1}`}
                      className="w-10 h-12 text-center text-lg font-bold rounded-lg border border-border bg-background text-foreground focus-ring tabular-nums"
                    />
                  ))}
                </div>
              ) : (
                /* Backup Code Input */
                <div className="space-y-1.5">
                  <label htmlFor="backup-code-input" className="block text-xs font-medium text-foreground">
                    Mã dự phòng (8 ký tự)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <KeyRound className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <input
                      id="backup-code-input"
                      type="text"
                      spellCheck={false}
                      required
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                      placeholder="VD: A3F82C9D"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-border bg-background font-mono text-xs tracking-wider uppercase focus-ring"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-foreground hover:bg-foreground/90 text-background font-medium text-xs shadow-xs transition-[background-color,opacity] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer focus-ring"
              >
                {isSubmitting ? (
                  <span>Đang xác nhận mã…</span>
                ) : (
                  <>
                    <span>Xác nhận & Tiếp tục</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </>
                )}
              </button>

              {/* Mode switch */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setUseBackupCode(!useBackupCode)}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                >
                  {useBackupCode
                    ? 'Quay lại nhập mã OTP 6 chữ số'
                    : 'Không thể truy cập Authenticator? Dùng mã dự phòng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
