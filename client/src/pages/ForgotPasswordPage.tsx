import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, KeyRound, Mail, Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { apiClient, getErrorMessage } from '../api/client';
import { toast } from 'sonner';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      toast.success(res.data.data.message || 'Mã khôi phục đã được tạo.');
      if (res.data.data.resetToken) {
        setToken(res.data.data.resetToken);
      }
      setStep('reset');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Có lỗi xảy ra khi tạo yêu cầu.'));
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
        <Link to="/login" className="text-xs text-slate-500 hover:text-brand flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại Đăng nhập
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto shadow-sm">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Khôi phục mật khẩu</h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {step === 'request'
                  ? 'Nhập địa chỉ email tài khoản của bạn để nhận liên kết xác thực HMAC 15 phút.'
                  : 'Nhập mã token đã được cấp và mật khẩu mới cho tài khoản của bạn.'}
              </p>
            </div>

            {step === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-md shadow-brand/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Đang tạo mã khôi phục...</span>
                  ) : (
                    <>
                      <span>Tạo Mã Khôi Phục</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mã Token khôi phục
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Mã token HMAC..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand break-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mật khẩu mới (≥8 ký tự, hoa, thường, số, ký tự đặc biệt)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-md shadow-brand/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Đang cập nhật mật khẩu...</span>
                  ) : (
                    <>
                      <span>Cập Nhật Mật Khẩu Mới</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="text-xs text-brand hover:underline font-semibold cursor-pointer"
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
