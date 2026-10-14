import { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle2,
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Moon,
  Sun,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from './lib/utils';

export function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand flex items-center justify-center text-white shadow-sm shadow-brand/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">Flux</span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand font-medium">
                Personal Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition-colors"
              title="Chuyển chế độ Sáng / Tối"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="h-8 w-px bg-border mx-1" />

            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="h-8 w-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-semibold text-xs">
                JD
              </div>
              <span className="hidden md:inline-block">John Doe</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 container py-6 space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Xin chào, John! 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Hôm nay bạn có <span className="font-semibold text-foreground">3 nhiệm vụ ưu tiên</span> và dòng tiền tháng này đang tăng trưởng dương.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
              Bảo mật cấp cao (Dual JWT + 2FA)
            </span>
          </div>
        </div>

        {/* 3 Core Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Widget 1: Personal Finance */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                  <Wallet className="h-4 w-4 text-brand" />
                  <span>Tổng số dư ví</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +12.5%
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight tabular-nums">
                  {formatCurrency(48500000)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">3 ví hoạt động (Tiền mặt, Techcombank, Tiết kiệm)</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <ArrowDownRight className="h-3.5 w-3.5" />
                <span>Thu: {formatCurrency(25000000)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-500 font-medium">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Chi: {formatCurrency(8300000)}</span>
              </div>
            </div>
          </div>

          {/* Widget 2: Priority Tasks */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-brand" />
                  <span>Việc gấp trong ngày</span>
                </div>
                <span className="text-xs text-muted-foreground">3 / 5 xong</span>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border text-brand focus:ring-brand" />
                  <span className="line-through text-muted-foreground text-xs">Thanh toán hóa đơn Internet</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-brand focus:ring-brand" />
                  <span className="font-medium text-xs">Nộp báo cáo tiến độ tuần</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-semibold">Gấp</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-brand focus:ring-brand" />
                  <span className="text-xs">Đọc 20 trang sách tài chính</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Deadline gần nhất: 17:00
              </span>
              <span className="text-brand font-medium hover:underline cursor-pointer">Xem tất cả</span>
            </div>
          </div>

          {/* Widget 3: Pinned Notes */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                  <FileText className="h-4 w-4 text-brand" />
                  <span>Ghi chú đã ghim</span>
                </div>
                <span className="text-xs text-muted-foreground">Markdown</span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="p-2.5 rounded-xl bg-muted/50 border border-border hover:border-brand/40 transition-colors cursor-pointer">
                  <div className="font-semibold text-xs line-clamp-1">Kế hoạch tiết kiệm mua xe 2027</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">Mục tiêu tích lũy 5 triệu/tháng vào quỹ đầu tư...</p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/50 border border-border hover:border-brand/40 transition-colors cursor-pointer">
                  <div className="font-semibold text-xs line-clamp-1">Danh sách checklist du lịch Đà Lạt</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">CCCD, sạc dự phòng, áo ấm, vé máy bay...</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>2 ghi chú ghim</span>
              <span className="text-brand font-medium hover:underline cursor-pointer">+ Thêm nhanh</span>
            </div>
          </div>
        </div>

        {/* Action Highlights */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-brand/10 via-brand/5 to-transparent border border-brand/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-base">Hạ tầng mã nguồn đã sẵn sàng 🚀</h2>
            <p className="text-xs text-muted-foreground mt-1">
              PostgreSQL Schema, Dual JWT Authentication, Redis Rate Limiter, và giao diện Mobile-First đã được cấu hình hoàn chỉnh.
            </p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-brand text-white font-medium text-xs hover:bg-brand-hover shadow-sm shadow-brand/30 transition-all flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tạo giao dịch đầu tiên
          </button>
        </div>
      </main>

      {/* Mobile-First Floating Quick Action Button (Thumb Zone) */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <button
          className="h-14 w-14 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/40 hover:scale-105 active:scale-95 transition-transform"
          aria-label="Thêm nhanh"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Flux Workspace © 2026 — Clean Architecture & Enterprise Web Security
      </footer>
    </div>
  );
}

export default App;
