import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Mail, Lock, User, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    if (!agreedToTerms) {
      toast.error('Vui lòng đồng ý với điều khoản sử dụng.');
      return;
    }

    if (passedCount < 5) {
      toast.error('Mật khẩu chưa đáp ứng đầy đủ yêu cầu bảo mật.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await register(email, password, fullName);
      toast.success(result.message || 'Đăng ký thành công! Hãy kiểm tra mã xác thực.');
      navigate('/verify-email', {
        state: {
          email,
          verificationToken: result.verificationToken,
        },
      });
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Đăng ký không thành công. Vui lòng kiểm tra lại.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="text-xs text-slate-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-brand font-bold hover:underline ml-1">
            Đăng nhập ngay
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold tracking-tight">Tạo tài khoản Flux</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Khởi tạo không gian làm việc cá nhân an toàn và độc lập cho bạn.
              </p>
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Mã hóa một chiều Argon2id & Cơ sở dữ liệu phân quyền RLS.</span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Họ và tên
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mật khẩu
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-all font-mono"
                  />
                </div>

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Độ mạnh mật khẩu:</span>
                      <span className="font-bold">{strengthText}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className={`h-full flex-1 transition-all ${
                            idx <= passedCount ? strengthColor : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 pt-1">
                      <span className={hasMinLength ? 'text-emerald-600 font-semibold flex items-center gap-1' : ''}>
                        {hasMinLength && <Check className="w-3 h-3" />} ≥ 8 ký tự
                      </span>
                      <span className={hasUpper ? 'text-emerald-600 font-semibold flex items-center gap-1' : ''}>
                        {hasUpper && <Check className="w-3 h-3" />} Chữ hoa (A-Z)
                      </span>
                      <span className={hasLower ? 'text-emerald-600 font-semibold flex items-center gap-1' : ''}>
                        {hasLower && <Check className="w-3 h-3" />} Chữ thường (a-z)
                      </span>
                      <span className={hasNumber && hasSpecial ? 'text-emerald-600 font-semibold flex items-center gap-1' : ''}>
                        {hasNumber && hasSpecial && <Check className="w-3 h-3" />} Số & Ký tự đặc biệt
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand mt-0.5"
                />
                <span>
                  Tôi đồng ý với <span className="text-brand font-medium">Điều khoản sử dụng</span> và{' '}
                  <span className="text-brand font-medium">Chính sách bảo mật</span> dữ liệu cá nhân của Flux.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-md shadow-brand/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Đang tạo tài khoản...</span>
                ) : (
                  <>
                    <span>Đăng Ký Tài Khoản</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
