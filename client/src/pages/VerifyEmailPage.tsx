import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Mail, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { apiClient } from '../api/client';
import { toast } from 'sonner';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialEmail = searchParams.get('email') || location.state?.email || 'demo.user@flux.workspace';
  const initialToken = searchParams.get('token') || location.state?.verificationToken || '';

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If token is already present in query params, auto verify
  useEffect(() => {
    if (initialToken && initialEmail) {
      handleVerify(initialEmail, initialToken);
    }
  }, []);

  const handleVerify = async (verifyEmail: string, verifyToken: string) => {
    if (!verifyToken) {
      toast.error('Vui lòng nhập mã xác thực (HMAC Token).');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await apiClient.post('/auth/verify-email', {
        email: verifyEmail,
        token: verifyToken,
      });

      setIsSuccess(true);
      toast.success(res.data.data.message || 'Xác thực email thành công!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Xác thực thất bại.';
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await apiClient.post('/auth/resend-verification', { email });
      if (res.data.data.verificationToken) {
        setToken(res.data.data.verificationToken);
      }
      toast.success('Mã kích hoạt mới đã được tạo!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể gửi lại mã kích hoạt.');
    } finally {
      setIsResending(false);
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
        <Link to="/login" className="text-xs text-slate-500 hover:text-brand font-semibold">
          Quay lại Đăng nhập
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 text-center">
            {isSuccess ? (
              <div className="space-y-4 py-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Kích hoạt tài khoản thành công!</h1>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Email của bạn đã được xác thực an toàn. Bạn hiện có thể đăng nhập vào không gian làm việc Flux.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-md shadow-brand/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Tiến Hành Đăng Nhập</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="h-14 w-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto shadow-sm">
                  <Mail className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight">Xác thực tài khoản</h1>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Chúng tôi đã tạo mã chữ ký HMAC bảo mật để kích hoạt tài khoản của bạn:
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerify(email, token);
                  }}
                  className="space-y-4 text-left pt-2"
                >
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Địa chỉ Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Mã xác thực HMAC (15 phút)
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Dán mã kích hoạt tại đây..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand break-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-md shadow-brand/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifying ? (
                      <span>Đang kiểm tra chữ ký...</span>
                    ) : (
                      <>
                        <span>Kích Hoạt Tài Khoản Ngay</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Chưa nhận được mã?</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-brand font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    <span>Gửi lại mã mới</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
