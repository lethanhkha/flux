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
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-foreground selection:text-background transition-colors duration-150">
      {/* Main Top Application Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5 focus-ring rounded-md">
              <FluxLogo variant="compact" size="sm" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Điều hướng chính">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = currentTab === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-[background-color,color] focus-ring ${
                      isActive
                        ? 'bg-muted text-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Action Trigger Button with ⌘K badge */}
            <Tooltip content="Thao tác nhanh: Giao dịch, Công việc, Ghi chú (⌘K)">
              <button
                type="button"
                onClick={() => setIsQuickActionOpen(true)}
                aria-label="Thao tác nhanh"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 text-xs font-medium shadow-xs transition-[background-color,opacity] cursor-pointer focus-ring"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Thao tác</span>
                <kbd className="hidden sm:inline-flex items-center text-[10px] px-1 py-0.2 rounded bg-background/20 font-mono text-background/90" translate="no">
                  ⌘K
                </kbd>
              </button>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip content={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
                className="p-1.5 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer focus-ring"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
              </button>
            </Tooltip>

            <div className="h-4 w-px bg-border mx-0.5 hidden sm:block" />

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-muted border border-border text-foreground flex items-center justify-center font-semibold text-xs">
                {user?.fullName?.charAt(0) || 'F'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold leading-tight line-clamp-1">{user?.fullName || 'Tài khoản'}</div>
                <div className="text-[10px] text-muted-foreground line-clamp-1">{user?.email || ''}</div>
              </div>
              <Tooltip content="Đăng xuất">
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Đăng xuất khỏi tài khoản"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer focus-ring"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
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
        className="md:hidden sticky bottom-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-3 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around"
      >
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = currentTab === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              aria-label={link.label}
              title={link.label}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors focus-ring ${
                isActive
                  ? 'text-foreground bg-muted font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 5. Floating Quick Action Button (FAB) for Mobile */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] right-4 z-50 md:hidden">
        <button
          type="button"
          onClick={() => setIsQuickActionOpen(true)}
          className="h-11 w-11 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:opacity-90 active:scale-95 transition-[transform,opacity] cursor-pointer focus-ring"
          aria-label="Thao tác nhanh"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* 5b. Smooth Scroll to Top Floating Button */}
      {showScrollTop && (
        <Tooltip content="Cuộn lên đầu trang">
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Cuộn lên đầu trang"
            className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-4 md:right-6 z-40 p-2 rounded-lg bg-card text-card-foreground border border-border shadow-md hover:bg-muted active:scale-95 transition-[background-color,transform] focus-ring cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" aria-hidden="true" />
          </button>
        </Tooltip>
      )}

      {/* 6. Quick Action Modal Dialog */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground mt-auto bg-background">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Flux Workspace © 2026 — Không gian làm việc cá nhân & tài chính chuẩn mực.</span>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link to="/finance" className="hover:text-foreground transition-colors">Tài chính</Link>
            <Link to="/tasks" className="hover:text-foreground transition-colors">Công việc</Link>
            <Link to="/notes" className="hover:text-foreground transition-colors">Ghi chú</Link>
            <Link to="/settings" className="hover:text-foreground transition-colors">Cài đặt</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
