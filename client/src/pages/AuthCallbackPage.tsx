import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, RefreshCw } from 'lucide-react';
import { setAccessToken } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const hasHandled = useRef(false);

  useEffect(() => {
    if (hasHandled.current) return;
    hasHandled.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      if (error === 'google_cancelled') {
        toast.info('Bạn đã hủy đăng nhập với Google.');
      } else {
        toast.error('Đăng nhập bằng Google không thành công. Vui lòng thử lại.');
      }
      navigate('/login', { replace: true });
      return;
    }

    if (token) {
      const finishLogin = async () => {
        try {
          setAccessToken(token);
          localStorage.setItem('flux_has_session', 'true');
          await refreshUser();
          toast.success('Đăng nhập thành công với tài khoản Google!');
          navigate('/dashboard', { replace: true });
        } catch {
          toast.error('Không thể hoàn tất đăng nhập. Vui lòng đăng nhập lại.');
          navigate('/login', { replace: true });
        }
      };

      finishLogin();
    } else {
      toast.error('Không tìm thấy thông tin phiên đăng nhập.');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans flex flex-col items-center justify-center p-4 selection:bg-brand selection:text-white page-enter">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">Đang đồng bộ tài khoản...</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hệ thống đang bảo mật và kích hoạt không gian làm việc của bạn.
          </p>
        </div>
        <div className="flex items-center justify-center pt-2">
          <RefreshCw className="w-5 h-5 animate-spin text-brand" />
        </div>
      </div>
    </div>
  );
};
