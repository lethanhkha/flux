import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../api/client';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith('@gmail.com')) {
      toast.error('Vui lòng nhập địa chỉ Gmail hợp lệ (@gmail.com).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const data = await login(normalizedEmail, password);

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
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-brand font-bold hover:underline ml-1">
            Đăng ký ngay
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold tracking-tight">Chào mừng quay trở lại</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhập email và mật khẩu để tiếp tục vào không gian làm việc cá nhân của bạn.
              </p>
            </div>

            {/* Security Note */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-500 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Đăng nhập bảo mật vào không gian làm việc của bạn.</span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="ten_cua_ban@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mật khẩu
                  </label>
                  <Link to="/forgot-password" className="text-xs text-brand font-medium hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  <span className="text-slate-600 dark:text-slate-400">Duy trì đăng nhập 7 ngày</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-md shadow-brand/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Đang xác thực...</span>
                ) : (
                  <>
                    <span>Đăng Nhập Vào Flux</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-400">
              Chưa có tài khoản Flux?{' '}
              <Link to="/register" className="text-brand font-semibold hover:underline">
                Đăng ký tài khoản mới
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
