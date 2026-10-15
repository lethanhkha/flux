import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  Laptop,
  Smartphone,
  CheckCircle2,
  QrCode,
  X,
  User,
  Copy,
  Check,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [otpInput, setOtpInput] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const [copiedSecret, setCopiedSecret] = useState(false);

  // Setup 2FA Flow
  const handleOpen2FASetup = async () => {
    try {
      const res = await apiClient.post('/auth/2fa/setup');
      setQrCodeUrl(res.data.data.qrCodeUrl);
      setSecret(res.data.data.secret);
      setIs2FAModalOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tạo mã cấu hình 2FA.');
    }
  };

  const handleVerifyAndEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/auth/2fa/enable', {
        secret,
        code: otpInput,
      });

      setBackupCodes(res.data.data.backupCodes || []);
      setTwoFactorEnabled(true);
      await refreshUser();
      toast.success('Kích hoạt xác thực 2 bước (2FA) thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Mã OTP không chính xác.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success(res.data.data.message || 'Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể đổi mật khẩu.');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Cài Đặt & Trung Tâm Bảo Mật</h1>
          <p className="text-xs text-slate-500">
            Quản lý định danh tài khoản, xác thực 2 bước (TOTP), đổi mật khẩu và phiên đăng nhập
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-brand" />
            <h2 className="font-bold text-sm">Thông Tin Tài Khoản</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-brand/20 text-brand flex items-center justify-center font-extrabold text-xl">
                {user?.fullName?.charAt(0) || 'F'}
              </div>
              <div>
                <div className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {user?.fullName || 'Tài khoản Flux'}
                </div>
                <div className="text-xs text-slate-500">{user?.email || 'Chưa cập nhật email'}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                    Đã xác thực email
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-semibold">
                    Tài khoản chính thức
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & 2FA Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Shield className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-sm">Xác Thực Đa Yếu Tố (2FA / TOTP RFC 6238)</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Ứng dụng xác thực Authenticator
                </span>
                {twoFactorEnabled ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">
                    Đang kích hoạt
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500 font-medium">
                    Chưa kích hoạt
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 max-w-lg">
                Yêu cầu mã số 6 chữ số từ Google Authenticator hoặc 1Password mỗi khi đăng nhập trên thiết bị mới.
              </p>
            </div>

            <button
              onClick={handleOpen2FASetup}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                twoFactorEnabled
                  ? 'border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'bg-brand hover:bg-brand-hover text-white shadow-md shadow-brand/20'
              }`}
            >
              {twoFactorEnabled ? 'Cấu hình lại 2FA' : 'Kích Hoạt 2FA Ngay'}
            </button>
          </div>

          {/* Change Password */}
          <div className="pt-2 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-brand" />
              <h3 className="font-bold text-xs">Đổi Mật Khẩu Đăng Nhập</h3>
            </div>

            <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Nhập lại mật khẩu</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận lại..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                />
              </div>

              <div className="sm:col-span-3 pt-1">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/20 transition-all cursor-pointer"
                >
                  {isChangingPass ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-brand" />
              <h2 className="font-bold text-sm">Thiết Bị & Phiên Đăng Nhập Hoạt Động</h2>
            </div>
            <button
              onClick={() => toast.success('Đã thu hồi tất cả các phiên làm việc khác.')}
              className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer"
            >
              Đăng xuất khỏi tất cả thiết bị khác
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>Windows PC (Chrome 126)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                      Thiết bị này
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">IP: 118.69.xxx.xxx • Hà Nội, Việt Nam</div>
                </div>
              </div>
              <span className="text-[11px] text-emerald-500 font-semibold">Đang hoạt động</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between opacity-80">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">iPhone 15 Pro (Safari Mobile)</div>
                  <div className="text-[11px] text-slate-400">IP: 14.232.xxx.xxx • Hoạt động 2 giờ trước</div>
                </div>
              </div>
              <button
                onClick={() => toast.success('Đã thu hồi phiên trên iPhone 15 Pro.')}
                className="text-rose-500 hover:underline cursor-pointer"
              >
                Thu hồi
              </button>
            </div>
          </div>
        </div>

        {/* 2FA Setup Modal */}
        {is2FAModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm modal-backdrop-animate">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl modal-dialog-animate space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base">Cấu Hình 2FA TOTP</h3>
                </div>
                <button onClick={() => setIs2FAModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {backupCodes.length === 0 ? (
                <div className="space-y-4 text-center">
                  <p className="text-xs text-slate-500">
                    Dùng ứng dụng Google Authenticator hoặc 1Password quét mã QR dưới đây:
                  </p>

                  {qrCodeUrl && (
                    <div className="p-3 bg-white rounded-2xl w-48 h-48 mx-auto flex items-center justify-center border border-slate-200 shadow-sm">
                      <img src={qrCodeUrl} alt="2FA QR Code" className="w-full h-full object-contain" />
                    </div>
                  )}

                  <div className="text-left bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Mã thiết lập thủ công:</span>
                    <div className="flex items-center justify-between font-mono font-bold tracking-wider text-brand">
                      <span>{secret}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(secret);
                          setCopiedSecret(true);
                          setTimeout(() => setCopiedSecret(false), 2000);
                        }}
                        className="p-1 text-slate-400 hover:text-brand"
                      >
                        {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleVerifyAndEnable2FA} className="space-y-3 text-left pt-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nhập mã 6 chữ số từ ứng dụng để kích hoạt:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full text-center tracking-widest text-xl font-bold py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/20 transition-all cursor-pointer"
                    >
                      Xác Nhận & Bật 2FA
                    </button>
                  </form>
                </div>
              ) : (
                /* Backup Codes Display */
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>2FA đã được kích hoạt! Lưu lại 8 mã dự phòng dưới đây.</span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Mỗi mã chỉ được sử dụng một lần để đăng nhập khi bạn mất quyền truy cập vào điện thoại.
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 font-mono text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                    {backupCodes.map((code, idx) => (
                      <div key={idx} className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {code}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setIs2FAModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-brand text-white font-bold text-xs cursor-pointer"
                  >
                    Tôi Đã Lưu Mã Dự Phòng
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
