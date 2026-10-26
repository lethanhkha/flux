import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';
import {
  Wallet,
  CheckCircle2,
  FileText,
  Bell,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Tooltip, InfoTooltip } from '../components/common/Tooltip';
import { getRemainingDaysInfo, PRIORITY_TOOLTIPS } from '../lib/taskUtils';
import { EmptyNotes } from '../components/illustrations';
import { staggerContainer, staggerItem, springs } from '../lib/motionTokens';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [financeSummary, setFinanceSummary] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    activeWalletsCount: 1,
  });

  const [tasks, setTasks] = useState<
    Array<{
      id: string;
      title: string;
      completed: boolean;
      urgent: boolean;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      rawDueDate?: string | null;
      due: string;
      subtasksCount?: { total: number; completed: number };
    }>
  >([]);
  const [reminders, setReminders] = useState<
    Array<{
      id: string;
      title: string;
      scheduledAt: string;
      location?: string | null;
      status: string;
    }>
  >([]);
  const [pinnedNotes, setPinnedNotes] = useState<Array<{ id: string; title: string; snippet: string }>>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiClient.get('/dashboard');
        const data = res.data.data;

        if (data.finance) {
          setFinanceSummary({
            totalBalance: Number(data.finance.totalBalance) || 0,
            monthlyIncome: Number(data.finance.monthlyIncome) || 0,
            monthlyExpense: Number(data.finance.monthlyExpense) || 0,
            activeWalletsCount: Number(data.finance.activeWalletsCount) || 1,
          });
        }

        if (Array.isArray(data.priorityTasks)) {
          setTasks(
            data.priorityTasks.map((t: any) => ({
              id: t.id,
              title: t.title,
              completed: t.status === 'DONE',
              urgent: t.priority === 'URGENT' || t.priority === 'HIGH',
              priority: t.priority || 'MEDIUM',
              rawDueDate: t.dueDate || null,
              due: t.dueDate
                ? new Date(t.dueDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                : 'Không thời hạn',
              subtasksCount:
                Array.isArray(t.subtasks) && t.subtasks.length > 0
                  ? {
                      total: t.subtasks.length,
                      completed: t.subtasks.filter((st: any) => st.isCompleted).length,
                    }
                  : undefined,
            }))
          );
        }

        if (Array.isArray(data.pinnedNotes)) {
          setPinnedNotes(
            data.pinnedNotes.map((n: any) => ({
              id: n.id,
              title: n.title,
              snippet: (n.content || '').replace(/#/g, '').slice(0, 100),
            }))
          );
        }

        if (Array.isArray(data.upcomingReminders)) {
          setReminders(
            data.upcomingReminders.map((r: any) => ({
              id: r.id,
              title: r.title,
              scheduledAt: r.scheduledAt,
              location: r.location || null,
              status: r.status,
            }))
          );
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchDashboard();
    const handleRefresh = () => {
      fetchDashboard();
    };
    window.addEventListener('flux:refresh-data', handleRefresh);
    return () => window.removeEventListener('flux:refresh-data', handleRefresh);
  }, []);

  const toggleTask = async (id: string) => {
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

    try {
      await apiClient.patch(`/tasks/${id}/toggle`);
    } catch {
      // Degrade gracefully
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Không Gian Điều Hành Tổng Thể</span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Chào ngày mới{user?.fullName ? `, ${user.fullName}` : ''}! 👋
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tasks.length > 0 ? (
                <>
                  Hôm nay bạn có <span className="font-semibold text-slate-900 dark:text-slate-100">{tasks.length - completedCount} việc cần làm</span> và dòng tiền các ví đang tăng trưởng ổn định.
                </>
              ) : (
                'Không có công việc khẩn cấp nào cần giải quyết. Chúc bạn một ngày làm việc tràn đầy năng lượng!'
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
              Tài khoản được bảo vệ
            </span>
          </div>
        </div>

        {/* 4 Core Widgets Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {/* Widget 1: Personal Finance */}
          <motion.div
            variants={staggerItem}
            whileHover={{ y: -4, transition: springs.snappy }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                  <Wallet className="h-4 w-4 text-brand" />
                  <span>Tổng số dư ví</span>
                  <InfoTooltip content="Tổng số dư cộng dồn hiện có từ tất cả các ví đang hoạt động." />
                </div>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +12.5%
                </span>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-slate-100">
                  {formatCurrency(financeSummary.totalBalance)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {financeSummary.activeWalletsCount} ví hoạt động được đồng bộ an toàn
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ArrowDownRight className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Thu: {formatCurrency(financeSummary.monthlyIncome)}</span>
                  <InfoTooltip content="Tổng các khoản thu thực tế phát sinh trong tháng hiện tại (từ ngày 01 đến cuối tháng)." />
                </div>
                <div className="flex items-center gap-1 text-rose-500 font-semibold">
                  <ArrowUpRight className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Chi: {formatCurrency(financeSummary.monthlyExpense)}</span>
                  <InfoTooltip content="Tổng các khoản chi thực tế phát sinh trong tháng hiện tại (từ ngày 01 đến cuối tháng)." />
                </div>
              </div>
              <Tooltip content="Chuyển đến trang Quản lý tài chính, xem số dư các ví và lịch sử giao dịch">
                <Link
                  to="/finance"
                  className="text-xs text-brand font-semibold flex items-center gap-1 pt-1 hover:underline"
                >
                  <span>Quản lý dòng tiền chi tiết</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Tooltip>
            </div>
          </motion.div>

          {/* Widget 2: Priority Tasks */}
          <motion.div
            variants={staggerItem}
            whileHover={{ y: -4, transition: springs.snappy }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-brand" />
                  <span>Công việc cần ưu tiên</span>
                  <InfoTooltip content="Top 5 công việc quan trọng chưa hoàn thành, được ưu tiên theo mức độ khẩn cấp và hạn chót gần nhất để bạn tập trung xử lý." />
                </div>
                <span className="text-xs font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-md">
                  {completedCount} / {tasks.length} xong
                </span>
              </div>

              {tasks.length === 0 ? (
                <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1.5">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Không có việc khẩn cấp nào! 🎉</p>
                  <p className="text-[11px] text-slate-400">Bạn đã hoàn tất mọi mục tiêu hoặc chưa có việc gấp cần làm.</p>
                  <Link to="/tasks" className="inline-block pt-1 text-xs font-bold text-brand hover:underline">
                    + Thêm việc mới
                  </Link>
                </div>
              ) : (
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
                        onChange={() => { }}
                        aria-label={`Đánh dấu hoàn thành: ${task.title}`}
                        className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand checkbox-pop cursor-pointer focus-ring"
                      />
                      <span
                        className={`flex-1 line-clamp-1 transition-all ${task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'font-medium text-slate-800 dark:text-slate-200'
                          }`}
                      >
                        {task.title}
                      </span>

                      {/* Remaining days badge and urgent indicator */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {task.rawDueDate && (() => {
                          const remaining = getRemainingDaysInfo(task.rawDueDate, task.completed ? 'DONE' : 'TODO');
                          return (
                            <Tooltip content={`Hạn chót: ${remaining.formattedDue}`}>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-1 ${remaining.colorClasses}`}
                              >
                                <span>{remaining.shortLabel}</span>
                              </span>
                            </Tooltip>
                          );
                        })()}
                        {task.subtasksCount && (
                          <span
                            title={`Tiến độ việc con: ${task.subtasksCount.completed}/${task.subtasksCount.total}`}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium tabular-nums border border-slate-200 dark:border-slate-700"
                          >
                            {task.subtasksCount.completed}/{task.subtasksCount.total} việc
                          </span>
                        )}
                        {task.urgent && !task.completed && (
                          <Tooltip content={PRIORITY_TOOLTIPS[task.priority] || PRIORITY_TOOLTIPS.URGENT}>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold cursor-help">
                              Gấp
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {(() => {
                  if (tasks.length === 0) return 'Chưa có deadline';
                  const dueTodayCount = tasks.filter((t) => {
                    if (!t.rawDueDate || t.completed) return false;
                    const remaining = getRemainingDaysInfo(t.rawDueDate);
                    return remaining.days === 0;
                  }).length;
                  const overdueCount = tasks.filter((t) => {
                    if (!t.rawDueDate || t.completed) return false;
                    const remaining = getRemainingDaysInfo(t.rawDueDate);
                    return remaining.isOverdue;
                  }).length;

                  if (overdueCount > 0 && dueTodayCount > 0) {
                    return <span className="text-rose-500 font-semibold">{overdueCount} việc quá hạn • {dueTodayCount} việc hạn hôm nay</span>;
                  }
                  if (overdueCount > 0) {
                    return <span className="text-rose-500 font-semibold">{overdueCount} việc quá hạn</span>;
                  }
                  if (dueTodayCount > 0) {
                    return <span className="text-amber-600 dark:text-amber-400 font-semibold">{dueTodayCount} việc hạn hôm nay</span>;
                  }
                  return 'Theo sát tiến độ công việc';
                })()}
              </span>
              <Tooltip content="Chuyển đến trang Quản lý công việc để xem toàn bộ danh sách hoặc bảng Kanban">
                <Link to="/tasks" className="text-brand font-semibold hover:underline">
                  Xem tất cả
                </Link>
              </Tooltip>
            </div>
          </motion.div>

          {/* Widget 3: Upcoming Reminders (Exact-Time Events) */}
          <motion.div
            variants={staggerItem}
            whileHover={{ y: -4, transition: springs.snappy }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                  <Bell className="h-4 w-4 text-brand" />
                  <span>Nhắc hẹn sắp tới</span>
                  <InfoTooltip content="Lịch hẹn và sự kiện diễn ra vào các mốc giờ cụ thể. Hệ thống sẽ phát chuông báo khi đến giờ." />
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  {reminders.length} lịch hẹn
                </span>
              </div>

              {reminders.length === 0 ? (
                <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1.5">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Không có lịch hẹn nào sắp tới ⏰</p>
                  <p className="text-[11px] text-slate-400">Bạn chưa có sự kiện hoặc cuộc hẹn nào cần nhắc giờ.</p>
                  <Link to="/reminders" className="inline-block pt-1 text-xs font-bold text-brand hover:underline">
                    + Thêm nhắc hẹn
                  </Link>
                </div>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {reminders.map((r) => {
                    const timeStr = new Date(r.scheduledAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const isToday =
                      new Date(r.scheduledAt).toDateString() === new Date().toDateString();

                    return (
                      <Link
                        key={r.id}
                        to="/reminders"
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand line-clamp-1 transition-colors">
                            {r.title}
                          </div>
                          {r.location && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 line-clamp-1">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span>{r.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block px-2 py-0.5 rounded bg-brand/10 text-brand font-mono font-bold text-[11px]">
                            {timeStr}
                          </span>
                          {!isToday && (
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              {new Date(r.scheduledAt).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Báo chuông chuẩn xác</span>
              </span>
              <Tooltip content="Chuyển đến trang Quản lý Nhắc hẹn & Lịch trình">
                <Link to="/reminders" className="text-brand font-semibold hover:underline">
                  Xem tất cả
                </Link>
              </Tooltip>
            </div>
          </motion.div>

          {/* Widget 3: Pinned Notes */}
          <motion.div
            variants={staggerItem}
            whileHover={{ y: -4, transition: springs.snappy }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                  <FileText className="h-4 w-4 text-brand" />
                  <span>Ghi chú đã ghim</span>
                  <InfoTooltip
                    content="Những ghi chú quan trọng được bạn ghim lại từ Kho Tri Thức để theo dõi nhanh trên Bảng điều khiển"
                    ariaLabel="Thông tin ghi chú đã ghim"
                  />
                </div>
                <span className="text-xs text-slate-500 font-medium">Markdown</span>
              </div>

              {pinnedNotes.length === 0 ? (
                <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <EmptyNotes width={110} height={85} />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Chưa có ghi chú nào được ghim</p>
                  <p className="text-[11px] text-slate-400">Ghim các ghi chú quan trọng từ Kho Tri Thức để theo dõi nhanh.</p>
                  <Tooltip content="Chuyển đến kho tri thức để tạo hoặc ghim ghi chú">
                    <Link to="/notes" className="inline-block pt-1 text-xs font-bold text-brand hover:underline">
                      + Mở kho tri thức
                    </Link>
                  </Tooltip>
                </div>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {pinnedNotes.map((note) => (
                    <Tooltip key={note.id} content="Mở và xem toàn văn nội dung ghi chú này trong kho tri thức">
                      <Link
                        to={`/notes?id=${note.id}`}
                        className="block p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-brand/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/90 transition-all cursor-pointer group"
                      >
                        <div className="font-bold text-xs line-clamp-1 text-slate-800 dark:text-slate-200 group-hover:text-brand transition-colors">
                          {note.title}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {note.snippet}
                        </p>
                      </Link>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>{pinnedNotes.length} ghi chú ghim</span>
              <Tooltip content="Chuyển đến trang Quản lý ghi chú & tài liệu">
                <Link to="/notes" className="text-brand font-semibold hover:underline">
                  + Mở kho tri thức
                </Link>
              </Tooltip>
            </div>
          </motion.div>
        </motion.div>

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
  );
};
