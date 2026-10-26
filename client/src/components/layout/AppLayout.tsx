import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sun,
  Moon,
  LayoutDashboard,
  Wallet,
  CheckSquare,
  Bell,
  FileText,
  Settings,
  LogOut,
  Plus,
  ArrowUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { QuickActionModal } from './QuickActionModal';
import { Tooltip } from '../common/Tooltip';
import { FluxLogo } from '../brand/FluxLogo';
import { tabDirectionVariants, TAB_ORDER } from '../../lib/motionTokens';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const getTabBasePath = (pathname: string): string => {
  const base = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  if (base.startsWith('/dashboard')) return '/dashboard';
  if (base.startsWith('/finance')) return '/finance';
  if (base.startsWith('/tasks')) return '/tasks';
  if (base.startsWith('/reminders')) return '/reminders';
  if (base.startsWith('/notes')) return '/notes';
  if (base.startsWith('/settings')) return '/settings';
  return base;
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Track navbar tab navigation direction:
  // 1 = moving right (forward in navbar order, e.g. Dashboard -> Finance)
  // -1 = moving left (backward in navbar order, e.g. Finance -> Dashboard)
  // 0 = neutral (initial load or non-tab route)
  const currentTab = getTabBasePath(location.pathname);
  const prevTabRef = useRef(currentTab);
  const directionRef = useRef(0);

  if (prevTabRef.current !== currentTab) {
    const prevIndex = TAB_ORDER[prevTabRef.current];
    const currentIndex = TAB_ORDER[currentTab];

    if (prevIndex !== undefined && currentIndex !== undefined) {
      directionRef.current = currentIndex > prevIndex ? 1 : -1;
    } else {
      directionRef.current = 0;
    }
    prevTabRef.current = currentTab;
  }

  const direction = directionRef.current;

  // Scroll to top on tab switch
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentTab]);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('flux_theme') === 'dark' ||
      (!('flux_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Smooth scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    { to: '/reminders', label: 'Nhắc Hẹn', icon: Bell },
    { to: '/notes', label: 'Ghi Chú', icon: FileText },
    { to: '/settings', label: 'Cài Đặt', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-brand selection:text-white transition-colors duration-200">
      {/* Main Top Application Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <FluxLogo variant="compact" size="sm" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5" aria-label="Điều hướng chính">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all focus-ring ${
                      isActive
                        ? 'bg-brand/10 text-brand dark:bg-brand/20 font-bold'
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
            <Tooltip content="Thao tác nhanh: Thêm giao dịch, tạo công việc hoặc ghi chú mới">
              <button
                type="button"
                onClick={() => setIsQuickActionOpen(true)}
                aria-label="Thao tác nhanh (Giao dịch, Công việc, Ghi chú)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-sm shadow-brand/25 transition-all hover:scale-105 active:scale-95 cursor-pointer focus-ring"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Thêm Nhanh</span>
              </button>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip content={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer focus-ring"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </Tooltip>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold text-xs">
                {user?.fullName?.charAt(0) || 'F'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold leading-tight line-clamp-1">{user?.fullName || 'Tài khoản'}</div>
                <div className="text-[10px] text-slate-500 line-clamp-1">{user?.email || ''}</div>
              </div>
              <Tooltip content="Đăng xuất khỏi tài khoản">
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Đăng xuất"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer focus-ring"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Content View Area with Directional Tab Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={currentTab}
            custom={direction}
            variants={tabDirectionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            {children || <Outlet />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4. Mobile Bottom Navigation Bar (Thumb Zone with Safe-Area) */}
      <nav
        aria-label="Điều hướng di động"
        className="md:hidden sticky bottom-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around"
      >
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center gap-1 min-w-[56px] min-h-[44px] justify-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors focus-ring ${
                isActive ? 'text-brand font-bold bg-brand/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 5. Floating Quick Action Button (FAB) for Mobile */}
      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-5 z-50 md:hidden">
        <button
          type="button"
          onClick={() => setIsQuickActionOpen(true)}
          className="h-12 w-12 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/40 fab-breathing hover:scale-105 active:scale-95 transition-all cursor-pointer focus-ring"
          aria-label="Thao tác nhanh"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 5b. Smooth Scroll to Top Floating Button */}
      {showScrollTop && (
        <Tooltip content="Cuộn nhanh lên đầu trang">
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Cuộn lên đầu trang"
            className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-8 right-5 md:right-8 z-40 p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800/80 shadow-lg backdrop-blur-md hover:bg-brand hover:text-white dark:hover:bg-brand dark:hover:text-white hover:scale-105 active:scale-95 transition-all focus-ring cursor-pointer hover-lift"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </Tooltip>
      )}

      {/* 6. Quick Action Modal Dialog */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Flux Workspace © 2026 — Không gian làm việc cá nhân an toàn & tinh gọn.</span>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/dashboard" className="hover:text-brand transition-colors">Dashboard</Link>
            <span>•</span>
            <Link to="/finance" className="hover:text-brand transition-colors">Tài chính</Link>
            <span>•</span>
            <Link to="/tasks" className="hover:text-brand transition-colors">Công việc</Link>
            <span>•</span>
            <Link to="/notes" className="hover:text-brand transition-colors">Ghi chú</Link>
            <span>•</span>
            <Link to="/settings" className="hover:text-brand transition-colors">Cài đặt</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
