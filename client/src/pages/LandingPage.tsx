import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Wallet,
  CheckSquare,
  FileText,
  Lock,
  Zap,
  ArrowRight,
  TrendingUp,
  KeyRound,
  Eye,
  Check,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans selection:bg-brand selection:text-white page-enter">
      {/* Main Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand flex items-center justify-center text-white shadow-sm shadow-brand/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand to-indigo-600 bg-clip-text text-transparent">
              Flux
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-brand transition-colors">Tính Năng Cốt Lõi</a>
            <a href="#security" className="hover:text-brand transition-colors">Bảo Mật Cấp Cao</a>
            <a href="#architecture" className="hover:text-brand transition-colors">Kiến Trúc</a>
            <Link to="/login" className="hover:text-brand transition-colors font-semibold text-brand">
              Khám Phá Workspace
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold px-4 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Đăng Nhập
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white shadow-md shadow-brand/25 transition-all hover:scale-105 active:scale-95"
            >
              Bắt Đầu Miễn Phí
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Không Gian Làm Việc Cá Nhân All-in-One Thế Hệ Mới
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Làm chủ <span className="bg-gradient-to-r from-brand via-indigo-500 to-purple-600 bg-clip-text text-transparent">Tài Chính, Công Việc</span> và <span className="text-brand">Tri Thức</span> trong một nơi duy nhất.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Flux loại bỏ sự phân mảnh giữa hàng tá ứng dụng rời rạc. Tinh gọn, tốc độ dưới 200ms, bảo mật nghiêm ngặt với Dual JWT + Argon2id và hoàn toàn thuộc quyền kiểm soát của bạn.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-xl shadow-brand/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Tạo Tài Khoản Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-sm hover:border-brand/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4 text-brand" />
              <span>Trải Nghiệm Live Demo</span>
            </Link>
          </div>

          {/* Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> Miễn phí 100%</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> PostgreSQL 17 + Supabase</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> Mật khẩu Argon2id</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> Xác thực 2FA TOTP</span>
          </div>
        </div>
      </section>

      {/* 3 Core Modules */}
      <section id="features" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">3 Trụ Cột Năng Suất Cá Nhân</h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Mọi tính năng được tối giản hóa tối đa, tập trung vào trải nghiệm mượt mà và thao tác nhanh 1 chạm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover-lift space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Quản Lý Tài Chính & Ví</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Theo dõi tiền mặt, tài khoản ngân hàng, sổ tiết kiệm. Quản lý thu chi và chuyển khoản giữa các ví với độ chính xác cao và khóa dòng chống xung đột dữ liệu.
            </p>
            <div className="pt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Khóa dòng SELECT FOR UPDATE
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover-lift space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-bold">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Công Việc & To-Do List</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Lập kế hoạch công việc theo deadline, phân loại ưu tiên từ Low đến Urgent. Xem dạng danh sách hoặc Kanban kéo thả linh hoạt.
            </p>
            <div className="pt-2 text-xs font-semibold text-brand flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Recurring Engine hàng ngày/tuần
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover-lift space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Ghi Chú & Kho Tri Thức</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Soạn thảo Markdown đầy đủ với khả năng làm sạch DOMPurify chống XSS, gắn nhãn Tags JSONB và tìm kiếm toàn văn Full-Text Search qua PostgreSQL tsvector.
            </p>
            <div className="pt-2 text-xs font-semibold text-purple-600 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> DOMPurify Sanitize Zero XSS
            </div>
          </div>
        </div>
      </section>

      {/* Security Architecture Section */}
      <section id="security" className="py-16 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold">
              Tiêu chuẩn Bảo mật Nghiêm ngặt
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Phòng Thủ Theo Chiều Sâu (Defense-in-Depth)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <KeyRound className="w-5 h-5 text-brand" />
              <div className="font-bold text-sm">Dual JWT + RTR</div>
              <p className="text-slate-500">Access Token 15 phút lưu trong Memory. Refresh Token 7 ngày trong HttpOnly SameSite Cookie.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <div className="font-bold text-sm">2FA TOTP RFC 6238</div>
              <p className="text-slate-500">Tương thích Google Authenticator, 1Password kèm 8 mã khôi phục băm SHA-256 một chiều.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <Lock className="w-5 h-5 text-indigo-500" />
              <div className="font-bold text-sm">Argon2id Hashing</div>
              <p className="text-slate-500">Mã hóa mật khẩu bằng thuật toán đoạt giải Password Hashing Competition với chi phí bộ nhớ 64MB.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <div className="font-bold text-sm">Chống Brute-Force</div>
              <p className="text-slate-500">Distributed Token Bucket Rate Limiter và tự động khóa tài khoản 15 phút sau 5 lần nhập sai.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">Flux Personal Workspace</span>
            <span>— Tinh gọn, Năng suất và An toàn</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-brand font-medium">Đăng Nhập</Link>
            <Link to="/register" className="hover:text-brand font-medium">Đăng Ký</Link>
            <Link to="/login" className="text-brand font-bold hover:underline">Bắt Đầu Trải Nghiệm</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
