import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../contexts/AuthContext';
import { apiClient, getErrorMessage } from '../api/client';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isDisable2FAModalOpen, setIsDisable2FAModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [otpInput, setOtpInput] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setTwoFactorEnabled(user.twoFactorEnabled);
    }
  }, [user]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const [copiedSecret, setCopiedSecret] = useState(false);

  // Keyboard navigation: Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (is2FAModalOpen) setIs2FAModalOpen(false);
        if (isDisable2FAModalOpen) setIsDisable2FAModalOpen(false);
      }
    };
    if (is2FAModalOpen || isDisable2FAModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [is2FAModalOpen, isDisable2FAModalOpen]);

  // Setup 2FA Flow
  const handleOpen2FASetup = async () => {
    try {
      const res = await apiClient.post('/auth/2fa/setup');
      setQrCodeUrl(res.data.data.qrCodeUrl);
      setSecret(res.data.data.secret);
      setIs2FAModalOpen(true);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể tạo mã cấu hình 2FA.'));
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
      toast.error(getErrorMessage(err, 'Mã OTP không chính xác.'));
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDisabling2FA(true);
    try {
      await apiClient.post('/auth/2fa/disable', {
        password: disablePassword,
      });
      setTwoFactorEnabled(false);
      setIsDisable2FAModalOpen(false);
      setDisablePassword('');
      await refreshUser();
      toast.success('Đã hủy kích hoạt xác thực 2 bước (2FA).');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Mật khẩu xác nhận không đúng hoặc không thể hủy 2FA.'));
    } finally {
      setIsDisabling2FA(false);
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
      toast.error(getErrorMessage(err, 'Không thể đổi mật khẩu.'));
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-card border border-border p-5 rounded-lg space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cài đặt
          </h1>
          <p className="text-xs text-muted-foreground">
            Quản lý hồ sơ cá nhân, cấu hình xác thực 2 bước (2FA) và bảo mật tài khoản
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <User className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm text-foreground">Thông Tin Tài Khoản</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg border border-border bg-muted flex items-center justify-center font-bold text-lg text-foreground">
                {user?.fullName?.charAt(0) || 'F'}
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">
                  {user?.fullName || 'Tài khoản Flux'}
                </div>
                <div className="text-xs text-muted-foreground">{user?.email || 'Chưa cập nhật email'}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-medium">
                    Đã xác thực email
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-medium">
                    Tài khoản chính thức
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & 2FA Section */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm text-foreground">Xác Thực 2 Bước (2FA)</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-md bg-muted/40 border border-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs text-foreground">
                  Ứng dụng xác thực Authenticator
                </span>
                {twoFactorEnabled ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Đang kích hoạt
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-medium border border-border bg-muted text-muted-foreground">
                    Chưa kích hoạt
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground max-w-lg">
                Yêu cầu mã số 6 chữ số từ Google Authenticator hoặc 1Password mỗi khi đăng nhập trên thiết bị mới.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {twoFactorEnabled && (
                <button
                  type="button"
                  onClick={() => setIsDisable2FAModalOpen(true)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 transition-[background-color] cursor-pointer"
                >
                  Tắt 2FA
                </button>
              )}
              <button
                onClick={handleOpen2FASetup}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-[opacity,transform] cursor-pointer ${
                  twoFactorEnabled
                    ? 'border border-border bg-secondary hover:bg-muted text-foreground'
                    : 'bg-foreground text-background hover:opacity-90 active:scale-[0.98]'
                }`}
              >
                {twoFactorEnabled ? 'Cấu hình lại' : 'Kích Hoạt 2FA Ngay'}
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
              <h3 className="font-semibold text-xs text-foreground">Đổi Mật Khẩu Đăng Nhập</h3>
            </div>

            <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-medium block mb-1 text-foreground">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background font-mono focus-ring"
                />
              </div>

              <div>
                <label className="font-medium block mb-1 text-foreground">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới…"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background font-mono focus-ring"
                />
              </div>

              <div>
                <label className="font-medium block mb-1 text-foreground">Nhập lại mật khẩu</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới…"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background font-mono focus-ring"
                />
              </div>

              <div className="sm:col-span-3 pt-1">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="h-9 px-4 rounded-md bg-foreground text-background font-medium text-xs hover:opacity-90 active:scale-[0.98] transition-[opacity,transform] cursor-pointer disabled:opacity-50"
                >
                  {isChangingPass ? 'Đang cập nhật…' : 'Cập Nhật Mật Khẩu Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm text-foreground">Thiết Bị & Phiên Đăng Nhập</h2>
            </div>
            <button
              onClick={() => toast.success('Đã thu hồi tất cả các phiên làm việc khác.')}
              className="text-xs text-rose-500 hover:underline font-medium cursor-pointer"
            >
              Đăng xuất phiên khác
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-md bg-muted/30 border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md border border-border bg-background text-foreground flex items-center justify-center">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-foreground flex items-center gap-2">
                    <span>Windows PC (Chrome 126)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded border border-border bg-muted text-muted-foreground font-medium">
                      Thiết bị này
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">IP: 118.69.xxx.xxx • Hà Nội, Việt Nam</div>
                </div>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Đang hoạt động</span>
            </div>

            <div className="p-3 rounded-md bg-muted/30 border border-border flex items-center justify-between opacity-80">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md border border-border bg-background text-muted-foreground flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-foreground">iPhone 15 Pro (Safari Mobile)</div>
                  <div className="text-[11px] text-muted-foreground">IP: 14.232.xxx.xxx • Hoạt động 2 giờ trước</div>
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
          <div
            onClick={() => setIs2FAModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-2fa-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overscroll-contain modal-backdrop-animate"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg max-w-md w-full p-5 shadow-lg modal-dialog-animate space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md border border-border bg-muted flex items-center justify-center text-foreground font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <h3 id="modal-2fa-title" className="font-semibold text-base text-foreground">Cấu Hình Xác Thực 2 Bước (2FA)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIs2FAModalOpen(false)}
                  aria-label="Đóng"
                  className="p-1 text-muted-foreground hover:text-foreground rounded-md focus-ring"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {backupCodes.length === 0 ? (
                <div className="space-y-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Dùng ứng dụng Google Authenticator hoặc 1Password quét mã QR dưới đây:
                  </p>

                  {qrCodeUrl && (
                    <div className="p-3 bg-white rounded-lg w-44 h-44 mx-auto flex items-center justify-center border border-border shadow-xs">
                      <img src={qrCodeUrl} alt="2FA QR Code" className="w-full h-full object-contain" />
                    </div>
                  )}

                  <div className="text-left bg-muted/40 p-2.5 rounded-md border border-border text-xs">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Mã thiết lập thủ công:</span>
                    <div className="flex items-center justify-between font-mono font-bold tracking-wider text-foreground">
                      <span>{secret}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(secret);
                          setCopiedSecret(true);
                          setTimeout(() => setCopiedSecret(false), 2000);
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleVerifyAndEnable2FA} className="space-y-3 text-left pt-1">
                    <label className="block text-xs font-medium text-foreground">
                      Nhập mã 6 chữ số từ ứng dụng:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full text-center tracking-widest text-lg font-bold py-2 rounded-md border border-input bg-background font-mono focus-ring"
                    />
                    <button
                      type="submit"
                      className="w-full h-10 rounded-md bg-foreground text-background font-medium text-xs hover:opacity-90 active:scale-[0.99] transition-[opacity,transform] cursor-pointer"
                    >
                      Xác Nhận & Bật 2FA
                    </button>
                  </form>
                </div>
              ) : (
                /* Backup Codes Display */
                <div className="space-y-4">
                  <div className="p-3 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>2FA đã được kích hoạt! Lưu lại 8 mã dự phòng dưới đây.</span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Mỗi mã chỉ được sử dụng một lần để đăng nhập khi bạn mất quyền truy cập vào điện thoại.
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-md bg-muted/40 border border-border font-mono text-center text-xs font-medium text-foreground">
                    {backupCodes.map((code, idx) => (
                      <div key={idx} className="p-1.5 rounded border border-border bg-background">
                        {code}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setIs2FAModalOpen(false)}
                    className="w-full h-10 rounded-md bg-foreground text-background font-medium text-xs hover:opacity-90 active:scale-[0.99] transition-[opacity,transform] cursor-pointer"
                  >
                    Tôi Đã Lưu Mã Dự Phòng
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disable 2FA Modal */}
        {isDisable2FAModalOpen && (
          <div
            onClick={() => setIsDisable2FAModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-disable-2fa-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overscroll-contain modal-backdrop-animate"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg max-w-sm w-full p-5 shadow-lg modal-dialog-animate space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md border border-border bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 id="modal-disable-2fa-title" className="font-semibold text-base text-foreground">Tắt Xác Thực 2FA</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDisable2FAModalOpen(false)}
                  aria-label="Đóng"
                  className="p-1 text-muted-foreground hover:text-foreground rounded-md focus-ring"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleDisable2FA} className="space-y-4 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  Để đảm bảo an toàn, vui lòng nhập mật khẩu hiện tại của bạn để tắt xác thực 2 bước:
                </p>

                <div>
                  <label className="font-medium block mb-1 text-foreground">Mật khẩu của bạn</label>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background font-mono text-sm focus-ring"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDisable2FAModalOpen(false)}
                    className="flex-1 h-10 rounded-md border border-border bg-secondary hover:bg-muted text-foreground font-medium text-xs transition-[background-color] cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isDisabling2FA}
                    className="flex-1 h-10 rounded-md bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs transition-[background-color] disabled:opacity-50 cursor-pointer"
                  >
                    {isDisabling2FA ? 'Đang tắt…' : 'Xác Nhận Tắt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
};
