import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  CheckCircle2,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([
    { id: '1', title: 'Thanh toán tiền điện & Internet tháng 10', completed: true, urgent: false, due: 'Đã xong' },
    { id: '2', title: 'Hoàn thành báo cáo tài chính cá nhân Q3', completed: false, urgent: true, due: 'Hôm nay, 17:00' },
    { id: '3', title: 'Đọc 20 trang sách "Tâm lý học về tiền"', completed: false, urgent: false, due: '21:00' },
    { id: '4', title: 'Kiểm tra sao kê thẻ tín dụng Techcombank', completed: false, urgent: false, due: 'Ngày mai' },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextState = !t.completed;
          if (nextState) {
            toast.success(`Đã hoàn thành công việc: "${t.title}"`);
          }
          return { ...t, completed: nextState };
        }
        return t;
      })
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Xin chào, {user?.fullName || 'John Doe'}! 👋
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand/10 text-brand font-semibold border border-brand/20">
                All-in-one Hub
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hôm nay bạn có <span className="font-semibold text-slate-900 dark:text-slate-100">{tasks.length - completedCount} việc cần làm</span> và số dư các ví đang tăng trưởng ổn định.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
              Bảo mật cấp cao (Dual JWT + 2FA)
            </span>
          </div>
        </div>

        {/* 3 Core Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Widget 1: Personal Finance */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover-lift">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                  <Wallet className="h-4 w-4 text-brand" />
                  <span>Tổng số dư ví</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +12.5%
                </span>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-slate-100">
                  {formatCurrency(48500000)}
                </div>
                <p className="text-xs text-slate-500 mt-1">3 ví hoạt động (Tiền mặt, Techcombank, Tiết kiệm)</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ArrowDownRight className="h-4 w-4" />
                  <span>Thu: {formatCurrency(25000000)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-500 font-semibold">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Chi: {formatCurrency(8300000)}</span>
                </div>
              </div>
              <Link
                to="/finance"
                className="text-xs text-brand font-semibold flex items-center gap-1 pt-1 hover:underline"
              >
                <span>Quản lý dòng tiền chi tiết</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Widget 2: Priority Tasks */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover-lift">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-brand" />
                  <span>Việc gấp trong ngày</span>
                </div>
                <span className="text-xs font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-md">
                  {completedCount} / {tasks.length} xong
                </span>
              </div>
              <div className="mt-4 space-y-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center gap-2.5 text-xs p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand checkbox-pop cursor-pointer"
                    />
                    <span
                      className={`flex-1 line-clamp-1 transition-all ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'font-medium text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.urgent && !task.completed && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold">
                        Gấp
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Deadline gần nhất: 17:00
              </span>
              <Link to="/tasks" className="text-brand font-semibold hover:underline">
                Xem tất cả
              </Link>
            </div>
          </div>

          {/* Widget 3: Pinned Notes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover-lift">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                  <FileText className="h-4 w-4 text-brand" />
                  <span>Ghi chú đã ghim</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Markdown</span>
              </div>
              <div className="mt-4 space-y-2.5">
                <Link
                  to="/notes"
                  className="block p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-brand/40 transition-colors"
                >
                  <div className="font-bold text-xs line-clamp-1 text-slate-800 dark:text-slate-200">
                    Kế hoạch tích lũy tài chính 2027
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    Mục tiêu tích lũy 5 triệu/tháng vào quỹ đầu tư chỉ số VN30, phân bổ 3 ví dự phòng khẩn cấp...
                  </p>
                </Link>

                <Link
                  to="/notes"
                  className="block p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-brand/40 transition-colors"
                >
                  <div className="font-bold text-xs line-clamp-1 text-slate-800 dark:text-slate-200">
                    Checklist du lịch Đà Lạt cuối tuần
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    CCCD gắn chip, sạc dự phòng 20000mAh, thuốc chống say xe, áo ấm chống sương mù...
                  </p>
                </Link>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>2 ghi chú ghim</span>
              <Link to="/notes" className="text-brand font-semibold hover:underline">
                + Mở kho tri thức
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights & Quick Action */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-brand/10 via-brand/5 to-transparent border border-brand/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              Hệ sinh thái Flux đã sẵn sàng phục vụ
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Cơ sở dữ liệu Supabase kết nối trực tiếp, cơ chế Dual JWT an toàn và kiến trúc Clean Code bảo vệ mọi dữ liệu của bạn.
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              to="/finance"
              className="px-4 py-2.5 rounded-xl bg-brand text-white font-bold text-xs hover:bg-brand-hover shadow-sm shadow-brand/30 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Wallet className="h-4 w-4" />
              <span>Xem Ví & Giao Dịch</span>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
