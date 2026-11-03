import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Wallet,
  CheckSquare,
  FileText,
  Lock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Check,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { FluxLogo } from '../components/brand/FluxLogo';
import { springs } from '../lib/motionTokens';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background page-enter">
      {/* 1. Header */}
      <header className="border-b border-border bg-background/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 focus-ring rounded-md">
            <FluxLogo variant="compact" size="sm" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Tính năng</a>
            <a href="#preview" className="hover:text-foreground transition-colors">Giao diện thực tế</a>
            <a href="#security" className="hover:text-foreground transition-colors">Bảo mật</a>
            <Link to="/login" className="hover:text-foreground transition-colors font-semibold text-foreground">
              Không gian làm việc
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              to="/login"
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted transition-colors focus-ring"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors focus-ring shadow-xs flex items-center gap-1.5"
            >
              <span>Bắt đầu ngay</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-16 pb-16 sm:pt-24 sm:pb-20 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.gentle}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/60 text-foreground text-xs font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Flux Workspace 2026 — Kiến trúc chuẩn ACID & Bảo mật Enterprise</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.08 }}
            className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-[1.12] text-balance"
          >
            Không gian quản trị tài chính và công việc cá nhân.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.16 }}
            className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty"
          >
            Hợp nhất quản lý dòng tiền đa ví chuẩn ACID, kế hoạch tuần trực quan, chuông báo thức thời gian thực và trạm ghi chú Markdown tự động lưu ngầm.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.24 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-foreground hover:bg-foreground/90 text-background font-medium text-xs shadow-xs flex items-center justify-center gap-2 transition-colors focus-ring"
            >
              <span>Mở không gian làm việc</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-background border border-border text-foreground font-medium text-xs hover:bg-muted transition-colors flex items-center justify-center gap-2 focus-ring"
            >
              <span>Đăng nhập tài khoản</span>
            </Link>
          </motion.div>

          {/* Value Props Strip */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Miễn phí sử dụng</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Đồng bộ thời gian thực</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Xác thực 2 bước (2FA)</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Bảo mật tuyệt đối</span>
          </div>
        </div>
      </section>

      {/* 3. Live Product Viewport (Working Product Fragment instead of 3D Slop) */}
      <section id="preview" className="py-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Giao diện thực tế được tối ưu hóa cho hiệu năng cao
          </h2>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto">
            Không sử dụng hiệu ứng màu mè. Mọi chỉ số, hàng dữ liệu và nút bấm được thiết kế chính xác đến từng pixel.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-xl overflow-hidden">
          {/* Simulated Application Window Chrome */}
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 font-mono text-[11px] text-muted-foreground" translate="no">flux.app / overview</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>Đồng bộ máy chủ: 12ms</span>
            </div>
          </div>

          {/* Product Fragment Body */}
          <div className="p-5 sm:p-7 space-y-6 bg-card">
            {/* Unified Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 border border-border rounded-lg divide-y md:divide-y-0 md:divide-x divide-border bg-background">
              <div className="p-4 space-y-1">
                <div className="text-[11px] font-medium text-muted-foreground">Tổng số dư khả dụng</div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-foreground">
                  24.500.000&nbsp;₫
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  +12.5% so với tháng trước
                </div>
              </div>

              <div className="p-4 space-y-1">
                <div className="text-[11px] font-medium text-muted-foreground">Thu nhập tháng này</div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-foreground">
                  32.800.000&nbsp;₫
                </div>
                <div className="text-[11px] text-muted-foreground">Từ 2 ví hoạt động</div>
              </div>

              <div className="p-4 space-y-1">
                <div className="text-[11px] font-medium text-muted-foreground">Tổng chi tiêu thực tế</div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-foreground">
                  8.300.000&nbsp;₫
                </div>
                <div className="text-[11px] text-muted-foreground">Trong ngân sách an toàn</div>
              </div>

              <div className="p-4 space-y-1">
                <div className="text-[11px] font-medium text-muted-foreground">Công việc cần làm hôm nay</div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-foreground">
                  3 / 5
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  60% hoàn thành
                </div>
              </div>
            </div>

            {/* Split Data Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Recent Transactions */}
              <div className="border border-border rounded-lg p-4 space-y-3 bg-background">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    <span>Giao dịch phát sinh gần nhất</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Tháng hiện tại</span>
                </div>

                <div className="divide-y divide-border text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">Lương & Thưởng dự án Q3</div>
                      <div className="text-[11px] text-muted-foreground">Ví Techcombank • 01/11/2026</div>
                    </div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums text-right">
                      +28.000.000&nbsp;₫
                    </div>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">Tiền thuê văn phòng & Điện nước</div>
                      <div className="text-[11px] text-muted-foreground">Ví Tiền mặt • 02/11/2026</div>
                    </div>
                    <div className="text-rose-600 dark:text-rose-400 font-semibold tabular-nums text-right">
                      -6.500.000&nbsp;₫
                    </div>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">Cafe làm việc cùng đối tác</div>
                      <div className="text-[11px] text-muted-foreground">Ví Thẻ tín dụng • Hôm nay</div>
                    </div>
                    <div className="text-rose-600 dark:text-rose-400 font-semibold tabular-nums text-right">
                      -185.000&nbsp;₫
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Priority Tasks */}
              <div className="border border-border rounded-lg p-4 space-y-3 bg-background">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    <span>Công việc ưu tiên khẩn cấp</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Kanban & Planner</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-md border border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-medium text-foreground truncate">Hoàn tất đối soát sao kê ngân hàng</span>
                    </div>
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium shrink-0">Hôm nay</span>
                  </div>

                  <div className="p-2.5 rounded-md border border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="font-medium text-foreground truncate">Ký biên bản nghiệm thu hợp đồng</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">Ngày mai</span>
                  </div>

                  <div className="p-2.5 rounded-md border border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-medium text-foreground line-through text-muted-foreground truncate">
                        Sao lưu cơ sở dữ liệu PostgreSQL
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0">Đã xong</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Capabilities (Craft Asymmetric Matrix) */}
      <section id="features" className="py-16 border-t border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              3 Trụ cột cốt lõi được xây dựng chuẩn mực
            </h2>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              Không có tính năng thừa. Mọi công cụ tập trung vào độ tin cậy và tốc độ xử lý tức thì.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1 */}
            <div className="p-5 rounded-lg border border-border bg-background space-y-3">
              <div className="h-8 w-8 rounded-md bg-muted text-foreground flex items-center justify-center font-semibold border border-border">
                <Wallet className="w-4 h-4" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Quản lý tài chính đa ví ACID</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tạo ví tiền mặt, ngân hàng, quỹ tiết kiệm độc lập. Cơ chế khóa dòng dữ liệu PostgreSQL bảo đảm số dư không bao giờ sai lệch khi chuyển tiền liên ví.
              </p>
              <div className="pt-1 text-[11px] font-medium text-foreground flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>Số học chính xác với decimal.js</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 rounded-lg border border-border bg-background space-y-3">
              <div className="h-8 w-8 rounded-md bg-muted text-foreground flex items-center justify-center font-semibold border border-border">
                <CheckSquare className="w-4 h-4" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Lập kế hoạch tuần & Kanban</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                3 chế độ xem: Danh sách, Kanban kéo thả và Lịch tuần 7 ngày. Phân bổ công việc chi tiết với hạn chót riêng cho từng checklist con và hoàn tác xóa trong 6 giây.
              </p>
              <div className="pt-1 text-[11px] font-medium text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-foreground" aria-hidden="true" />
                <span>Weekly Planner cân đối khối lượng làm việc</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 rounded-lg border border-border bg-background space-y-3">
              <div className="h-8 w-8 rounded-md bg-muted text-foreground flex items-center justify-center font-semibold border border-border">
                <FileText className="w-4 h-4" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Markdown Vault & Nhắc hẹn</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Trình soạn thảo Markdown chia đôi 2 cột với tính năng tự động lưu ngầm. Hệ thống báo thức thời gian thực qua Web Audio API không phụ thuộc server push.
              </p>
              <div className="pt-1 text-[11px] font-medium text-foreground flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-foreground" aria-hidden="true" />
                <span>Tự động lưu ngầm Debounced Auto-save</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Security & Architecture */}
      <section id="security" className="py-16 border-t border-border bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Tiêu chuẩn bảo mật cấp hệ thống
            </h2>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              Bảo vệ toàn vẹn dữ liệu cá nhân theo các tiêu chuẩn kỹ thuật nghiêm ngặt nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <span>Dual JWT Token</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Access Token lưu строго trong bộ nhớ React, Refresh Token lưu trong HttpOnly Cookie có cơ chế xoay vòng RTR.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>Xác thực 2 bước 2FA</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Hỗ trợ TOTP chuẩn RFC 6238 qua Google Authenticator kết hợp 8 mã dự phòng băm an toàn.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <span>Mã hóa Argon2id</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Mật khẩu được băm bằng thuật toán Argon2id tiên tiến nhất, triệt tiêu nguy cơ tấn công GPU brute-force.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <Check className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <span>Chống Bot & Spam</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Tích hợp Cloudflare Turnstile vô hình và kiểm soát tần suất truy cập qua Redis Token Bucket.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground bg-background">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <FluxLogo variant="compact" size="xs" />
            <span>— Không gian làm việc cá nhân & tài chính chuẩn mực.</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/login" className="hover:text-foreground transition-colors font-medium">Đăng nhập</Link>
            <Link to="/register" className="hover:text-foreground transition-colors font-medium">Tạo tài khoản</Link>
            <Link to="/dashboard" className="hover:text-foreground transition-colors font-semibold text-foreground">Vào Workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
