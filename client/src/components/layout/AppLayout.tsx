import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Sun,
  Moon,
  LayoutDashboard,
  Wallet,
  CheckSquare,
  FileText,
  Settings,
  LogOut,
  Plus,
  Compass,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { toast } from 'sonner';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('flux_theme') === 'dark' ||
      (!('flux_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [quickActionType, setQuickActionType] = useState<'transaction' | 'task' | 'note'>('transaction');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available wallets for quick transaction
  const [wallets, setWallets] = useState<Array<{ id: string; name: string; currency: string; currentBalance: number }>>([]);

  // Quick Action form fields
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [txAmount, setTxAmount] = useState('120000');
  const [txCategory, setTxCategory] = useState('Ăn uống & Cafe');
  const [txNote, setTxNote] = useState('Ăn trưa với đồng nghiệp');
  const [txWalletId, setTxWalletId] = useState('');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [taskDueDate, setTaskDueDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 16));

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTag, setNoteTag] = useState('chung');

  // Load user wallets when quick action opens
  useEffect(() => {
    if (isQuickActionOpen) {
      apiClient
        .get('/finance/wallets')
        .then((res) => {
          if (res.data.data?.length > 0) {
            setWallets(res.data.data);
            if (!txWalletId) {
              setTxWalletId(res.data.data[0].id);
            }
          }
        })
        .catch(() => {
          // Silent fallback if offline/mock
        });
    }
  }, [isQuickActionOpen]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('flux_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('flux_theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Đã đăng xuất khỏi tài khoản.');
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/finance', label: 'Tài Chính', icon: Wallet },
    { to: '/tasks', label: 'Công Việc', icon: CheckSquare },
    { to: '/notes', label: 'Ghi Chú', icon: FileText },
    { to: '/settings', label: 'Cài Đặt', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-brand selection:text-white transition-colors duration-200">
      {/* 1. Quick Prototype Navigation Bar */}
      <div className="bg-indigo-950 text-indigo-200 text-xs py-1.5 px-4 border-b border-indigo-900/60 sticky top-0 z-50 overflow-x-auto whitespace-nowrap">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-brand" /> Prototype Nav:
            </span>
            <Link to="/" className="hover:text-white">Landing</Link> •
            <Link to="/login" className="hover:text-white">Login</Link> •
            <Link to="/two-factor-auth" className="hover:text-white">2FA</Link> •
            <Link to="/register" className="hover:text-white">Register</Link> •
            <Link to="/verify-email" className="hover:text-white">Verify Email</Link> •
            <Link to="/forgot-password" className="hover:text-white">Forgot Pass</Link> •
            <Link
              to="/dashboard"
              className={`px-1.5 py-0.5 rounded font-semibold ${
                location.pathname === '/dashboard' ? 'text-white bg-brand' : 'hover:text-white text-emerald-300'
              }`}
            >
              Dashboard
            </Link> •
            <Link
              to="/finance"
              className={`px-1.5 py-0.5 rounded ${
                location.pathname === '/finance' ? 'text-white bg-brand font-semibold' : 'hover:text-white'
              }`}
            >
              Finance
            </Link> •
            <Link
              to="/tasks"
              className={`px-1.5 py-0.5 rounded ${
                location.pathname === '/tasks' ? 'text-white bg-brand font-semibold' : 'hover:text-white'
              }`}
            >
              Tasks
            </Link> •
            <Link
              to="/notes"
              className={`px-1.5 py-0.5 rounded ${
                location.pathname === '/notes' ? 'text-white bg-brand font-semibold' : 'hover:text-white'
              }`}
            >
              Notes
            </Link> •
            <Link
              to="/settings"
              className={`px-1.5 py-0.5 rounded ${
                location.pathname === '/settings' ? 'text-white bg-brand font-semibold' : 'hover:text-white'
              }`}
            >
              Settings
            </Link>
          </div>
          <button
            onClick={toggleTheme}
            className="text-white/80 hover:text-white flex items-center gap-1 cursor-pointer"
            title="Chuyển chế độ Giao diện"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />}
            <span className="hidden sm:inline">{darkMode ? 'Giao diện Tối' : 'Giao diện Sáng'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Top Application Header */}
      <header className="sticky top-7 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-brand flex items-center justify-center text-white shadow-sm shadow-brand/30 hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand to-indigo-600 bg-clip-text text-transparent">
                Flux
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand/10 text-brand dark:bg-brand/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action Trigger Button */}
            <button
              onClick={() => setIsQuickActionOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-sm shadow-brand/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm Nhanh</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Đổi màu nền"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold text-xs">
                {user?.fullName?.charAt(0) || 'JD'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold leading-tight line-clamp-1">{user?.fullName || 'John Doe'}</div>
                <div className="text-[10px] text-slate-500 line-clamp-1">{user?.email || 'demo@flux.workspace'}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Content View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 page-enter">
        {children}
      </main>

      {/* 4. Mobile Bottom Navigation Bar (Thumb Zone) */}
      <div className="md:hidden sticky bottom-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive ? 'text-brand' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 5. Floating Quick Action Button (FAB) for Mobile */}
      <div className="fixed bottom-16 right-5 z-50 md:hidden">
        <button
          onClick={() => setIsQuickActionOpen(true)}
          className="h-12 w-12 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/40 fab-breathing hover:scale-105 active:scale-95 transition-all"
          aria-label="Thao tác nhanh"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 6. Quick Action Modal Dialog */}
      {isQuickActionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm modal-backdrop-animate">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl modal-dialog-animate space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base">Thao Tác Nhanh (Zero-Redirect)</h3>
              </div>
              <button
                onClick={() => setIsQuickActionOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switchers */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-center">
              <button
                type="button"
                onClick={() => setQuickActionType('transaction')}
                className={`py-1.5 rounded-lg transition-all ${
                  quickActionType === 'transaction'
                    ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Giao Dịch
              </button>
              <button
                type="button"
                onClick={() => setQuickActionType('task')}
                className={`py-1.5 rounded-lg transition-all ${
                  quickActionType === 'task'
                    ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Công Việc
              </button>
              <button
                type="button"
                onClick={() => setQuickActionType('note')}
                className={`py-1.5 rounded-lg transition-all ${
                  quickActionType === 'note'
                    ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Ghi Chú
              </button>
            </div>

            {/* Quick forms */}
            {quickActionType === 'transaction' && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const amountNum = parseFloat(txAmount);
                  if (isNaN(amountNum) || amountNum <= 0) {
                    toast.error('Vui lòng nhập số tiền hợp lệ (> 0).');
                    return;
                  }

                  const activeWalletId = txWalletId || wallets[0]?.id;
                  if (!activeWalletId) {
                    toast.error('Chưa có thông tin ví để ghi nhận giao dịch.');
                    return;
                  }

                  setIsSubmitting(true);
                  try {
                    await apiClient.post('/finance/transactions', {
                      walletId: activeWalletId,
                      type: txType,
                      amount: amountNum,
                      category: txCategory,
                      note: txNote || undefined,
                    });
                    toast.success('Đã lưu giao dịch tài chính mới thành công!');
                    setIsQuickActionOpen(false);
                    setTxAmount('120000');
                    setTxNote('');
                    window.dispatchEvent(new CustomEvent('flux:refresh-data'));
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Không thể tạo giao dịch.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">Loại giao dịch</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTxType('EXPENSE')}
                      className={`py-2 rounded-xl font-bold transition-all ${
                        txType === 'EXPENSE'
                          ? 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Chi Tiền (-)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType('INCOME')}
                      className={`py-2 rounded-xl font-bold transition-all ${
                        txType === 'INCOME'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Thu Tiền (+)
                    </button>
                  </div>
                </div>

                {wallets.length > 0 && (
                  <div>
                    <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">Ví thanh toán</label>
                    <select
                      value={txWalletId}
                      onChange={(e) => setTxWalletId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({new Intl.NumberFormat('vi-VN').format(Number(w.currentBalance))} {w.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">Số tiền (VND)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="VD: 150000"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">Danh mục</label>
                  <input
                    type="text"
                    required
                    placeholder="Ăn uống, Cafe, Mua sắm, Lương..."
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">Ghi chú (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="VD: Ăn trưa với đồng nghiệp..."
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs transition-all shadow-md shadow-brand/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Ghi Nhận Giao Dịch'}
                </button>
              </form>
            )}

            {quickActionType === 'task' && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!taskTitle.trim()) {
                    toast.error('Vui lòng nhập tiêu đề công việc.');
                    return;
                  }

                  setIsSubmitting(true);
                  try {
                    await apiClient.post('/tasks', {
                      title: taskTitle.trim(),
                      priority: taskPriority,
                      dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
                    });
                    toast.success('Đã thêm công việc mới vào danh sách to-do!');
                    setIsQuickActionOpen(false);
                    setTaskTitle('');
                    window.dispatchEvent(new CustomEvent('flux:refresh-data'));
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Không thể tạo công việc.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">Tiêu đề công việc</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Chuẩn bị tài liệu họp sáng mai..."
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">Mức ưu tiên</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                    >
                      <option value="LOW">Thấp (Low)</option>
                      <option value="MEDIUM">Trung bình (Medium)</option>
                      <option value="HIGH">Cao (High)</option>
                      <option value="URGENT">Khẩn cấp (Urgent)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">Hạn chót</label>
                    <input
                      type="datetime-local"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs transition-all shadow-md shadow-brand/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo Công Việc Mới'}
                </button>
              </form>
            )}

            {quickActionType === 'note' && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!noteTitle.trim()) {
                    toast.error('Vui lòng nhập tiêu đề ghi chú.');
                    return;
                  }
                  if (!noteContent.trim()) {
                    toast.error('Vui lòng nhập nội dung ghi chú.');
                    return;
                  }

                  setIsSubmitting(true);
                  try {
                    await apiClient.post('/notes', {
                      title: noteTitle.trim(),
                      content: noteContent.trim(),
                      tags: noteTag ? [noteTag] : ['chung'],
                    });
                    toast.success('Đã lưu ghi chú nhanh thành công!');
                    setIsQuickActionOpen(false);
                    setNoteTitle('');
                    setNoteContent('');
                    window.dispatchEvent(new CustomEvent('flux:refresh-data'));
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Không thể lưu ghi chú.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">Tiêu đề ghi chú</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Ý tưởng dự án mới..."
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">Thẻ / Phân loại</label>
                  <select
                    value={noteTag}
                    onChange={(e) => setNoteTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                  >
                    <option value="chung">Chung</option>
                    <option value="tài-chính">Tài chính</option>
                    <option value="công-việc">Công việc</option>
                    <option value="ý-tưởng">Ý tưởng</option>
                    <option value="bảo-mật">Bảo mật</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">Nội dung (Markdown)</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Nhập nội dung markdown tại đây..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs transition-all shadow-md shadow-brand/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Ghi Chú'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Flux Workspace © 2026 — Clean Architecture & Enterprise Web Security</span>
          <div className="flex items-center gap-4 text-[11px]">
            <span>PostgreSQL 17 + Supabase</span>
            <span>•</span>
            <span>Dual JWT + RTR</span>
            <span>•</span>
            <span>Argon2id + 2FA TOTP</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
