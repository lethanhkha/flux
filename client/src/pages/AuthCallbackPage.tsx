import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-6 shadow-sm text-center space-y-4">
        <div className="flex items-center justify-center pt-2">
          <Loader2 className="w-6 h-6 animate-spin text-foreground" />
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-semibold tracking-tight text-foreground">Đang đồng bộ tài khoản…</h1>
          <p className="text-xs text-muted-foreground">
            Hệ thống đang bảo mật và kích hoạt không gian làm việc của bạn.
          </p>
        </div>
      </div>
    </div>
  );
};
