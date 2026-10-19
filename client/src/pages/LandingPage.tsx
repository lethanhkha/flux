import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
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
import { FluxLogo } from '../components/brand/FluxLogo';
import { ShinyText, StarBorder, MagneticBox } from '../components/motion';
import { springs } from '../lib/motionTokens';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans selection:bg-brand selection:text-white page-enter">
      {/* Main Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <FluxLogo variant="compact" size="md" />
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
            <MagneticBox strength={5}>
              <Link
                to="/register"
                className="text-sm font-semibold px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white shadow-md shadow-brand/25 transition-all block hover:scale-105 active:scale-95"
              >
                Bắt Đầu Miễn Phí
              </Link>
            </MagneticBox>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.gentle}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <ShinyText className="text-brand font-semibold" speed={3}>
              Không Gian Làm Việc Cá Nhân All-in-One Thế Hệ Mới
            </ShinyText>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight"
          >
            Làm chủ{' '}
            <span className="bg-gradient-to-r from-brand via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Tài Chính, Công Việc
            </span>{' '}
            và <span className="text-brand">Tri Thức</span> trong một nơi duy nhất.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed"
          >
            Flux loại bỏ sự phân mảnh giữa hàng tá ứng dụng rời rạc. Tinh gọn, tốc độ tức thì, bảo mật dữ liệu nghiêm ngặt và hoàn toàn thuộc quyền kiểm soát của bạn.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <MagneticBox strength={8} className="w-full sm:w-auto">
              <StarBorder color="#818CF8" speed="3.5s" className="w-full sm:w-auto">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-[14px] bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-xl shadow-brand/30 flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Tạo Tài Khoản Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </StarBorder>
            </MagneticBox>

            <MagneticBox strength={8} className="w-full sm:w-auto">
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-sm hover:border-brand/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4 text-brand" />
                <span>Khám Phá Ngay</span>
              </Link>
            </MagneticBox>
          </motion.div>

          {/* Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> Miễn phí sử dụng</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> Đồng bộ đám mây</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> Bảo mật đa lớp</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> Riêng tư tuyệt đối</span>
          </div>

          {/* 3D Abstract Hero Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...springs.smooth, delay: 0.35 }}
            className="pt-8 max-w-5xl mx-auto relative group"
          >
            {/* Ambient Multi-Color Glow behind the frame */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-sky-500 via-brand to-emerald-500 rounded-3xl blur-2xl opacity-25 group-hover:opacity-40 transition duration-1000 -z-10" />

            <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-[#070A12] shadow-2xl shadow-brand/10">
              <picture>
                <source srcSet="/brand/flux-hero-3d.webp" type="image/webp" />
                <img
                  src="/brand/flux-hero-3d.png"
                  alt="Flux 3D Dynamic Productivity & Financial Workspace"
                  width="1920"
                  height="1080"
                  className="w-full h-auto object-cover transform hover:scale-[1.01] transition-transform duration-700"
                  loading="eager"
                />
              </picture>

              {/* Glass Floating Indicator Badges */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute top-4 left-4 sm:top-6 sm:left-6 px-4 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/10 text-left shadow-lg hidden sm:flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  💰
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tài Chính Cá Nhân</div>
                  <div className="text-xs font-bold text-white">+24.500.000₫ / tháng</div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 0.5 }}
                className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 px-4 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/10 text-left shadow-lg hidden sm:flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
                  🎯
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Kanban Tiến Độ</div>
                  <div className="text-xs font-bold text-white">5/5 Mục Tiêu Hoàn Tất</div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 1 }}
                className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 px-4 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/10 text-left shadow-lg hidden sm:flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                  📝
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Markdown Vault</div>
                  <div className="text-xs font-bold text-white">Live Sync Chuẩn ACID</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ ...springs.smooth, delay: 0 }}
            whileHover={{ y: -6, transition: springs.snappy }}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-brand/40 transition-colors"
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Quản Lý Tài Chính & Ví</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Theo dõi tiền mặt, tài khoản ngân hàng, sổ tiết kiệm. Quản lý thu chi và chuyển khoản giữa các ví với độ chính xác cao và số dư được đồng bộ tức thì.
            </p>
            <div className="pt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Quản lý dòng tiền thông minh
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ ...springs.smooth, delay: 0.12 }}
            whileHover={{ y: -6, transition: springs.snappy }}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-brand/40 transition-colors"
          >
            <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-bold">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Công Việc & To-Do List</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Lập kế hoạch công việc theo hạn chót, phân loại mức độ ưu tiên rõ ràng. Xem dạng danh sách hoặc bảng trực quan giúp bạn không bỏ lỡ việc quan trọng.
            </p>
            <div className="pt-2 text-xs font-semibold text-brand flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Tự động lặp lại theo chu kỳ
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ ...springs.smooth, delay: 0.24 }}
            whileHover={{ y: -6, transition: springs.snappy }}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-brand/40 transition-colors"
          >
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Ghi Chú & Kho Tri Thức</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Soạn thảo định dạng Markdown trực quan, phân loại linh hoạt theo thẻ nhãn, ghim ghi chú quan trọng và tìm kiếm nội dung nhanh chóng.
            </p>
            <div className="pt-2 text-xs font-semibold text-purple-600 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Lưu trữ an toàn & riêng tư
            </div>
          </motion.div>
        </div>
      </section>

      {/* Security Architecture Section */}
      <section id="security" className="py-16 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold">
              Tiêu Chuẩn Bảo Mật
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Bảo Vệ Toàn Diện Cho Dữ Liệu Của Bạn</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ ...springs.smooth, delay: 0 }}
              whileHover={{ y: -4, transition: springs.snappy }}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-brand/30 transition-colors"
            >
              <KeyRound className="w-5 h-5 text-brand" />
              <div className="font-bold text-sm">Bảo Vệ Đăng Nhập</div>
              <p className="text-slate-500">Tự động duy trì phiên làm việc an toàn, bảo vệ tài khoản khỏi nguy cơ bị đánh cắp thông tin đăng nhập.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ ...springs.smooth, delay: 0.08 }}
              whileHover={{ y: -4, transition: springs.snappy }}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-brand/30 transition-colors"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <div className="font-bold text-sm">Xác Thực 2 Bước (2FA)</div>
              <p className="text-slate-500">Bảo vệ tài khoản qua ứng dụng Google Authenticator và cung cấp mã dự phòng khi cần thiết.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ ...springs.smooth, delay: 0.16 }}
              whileHover={{ y: -4, transition: springs.snappy }}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-brand/30 transition-colors"
            >
              <Lock className="w-5 h-5 text-indigo-500" />
              <div className="font-bold text-sm">Mã Hóa Mật Khẩu</div>
              <p className="text-slate-500">Mật khẩu của bạn được mã hóa an toàn ở mức cao nhất, đảm bảo tính bảo mật và riêng tư tuyệt đối.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ ...springs.smooth, delay: 0.24 }}
              whileHover={{ y: -4, transition: springs.snappy }}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-brand/30 transition-colors"
            >
              <Zap className="w-5 h-5 text-amber-500" />
              <div className="font-bold text-sm">Chống Xâm Nhập</div>
              <p className="text-slate-500">Hệ thống tự động phát hiện và ngăn chặn các hành vi dò đoán mật khẩu bất thường trên tài khoản của bạn.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <FluxLogo variant="compact" size="xs" />
            <span className="text-slate-400">— Không gian làm việc cá nhân Tinh gọn, Năng suất và An toàn</span>
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
