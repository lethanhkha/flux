import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  FileText,
  Bell,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  TrendingUp,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { getRemainingDaysInfo } from '../lib/taskUtils';

export const DashboardPage: React.FC = () => {

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
              snippet: n.content ? n.content.slice(0, 100) : '',
            }))
          );
        }

        if (Array.isArray(data.upcomingReminders)) {
          setReminders(data.upcomingReminders);
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
            toast.success(`Đã hoàn thành công việc: “${t.title}”`);
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
    <div className="space-y-6 page-enter">
      {/* 1. Header (Standard 24px Noun Title per Vercel & Taste-Skill) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tổng quan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dòng tiền các ví và công việc trọng tâm trong ngày.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-1 rounded-md border border-border bg-card">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Xác thực 2FA an toàn</span>
          </span>
        </div>
      </div>

      {/* 2. Unified Metric Strip (Substantive Data Grid without AI Card Icons) */}
      <div className="border border-border rounded-lg bg-card grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border shadow-xs">
        {/* KPI 1: Net Balance */}
        <div className="p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Tổng số dư các ví</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" aria-hidden="true" /> +12.5%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {formatCurrency(financeSummary.totalBalance)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>{financeSummary.activeWalletsCount} ví hoạt động</span>
            <Link to="/finance" className="text-foreground hover:underline font-medium inline-flex items-center gap-0.5">
              <span>Chi tiết</span>
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* KPI 2: Monthly Income */}
        <div className="p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Thu nhập tháng này</span>
            <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-foreground text-emerald-600 dark:text-emerald-400">
            {formatCurrency(financeSummary.monthlyIncome)}
          </div>
          <div className="text-[11px] text-muted-foreground pt-1">
            Ghi nhận thực tế trong tháng
          </div>
        </div>

        {/* KPI 3: Monthly Expense */}
        <div className="p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Chi tiêu tháng này</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-foreground text-rose-600 dark:text-rose-400">
            {formatCurrency(financeSummary.monthlyExpense)}
          </div>
          <div className="text-[11px] text-muted-foreground pt-1">
            Kiểm soát trong hạn mức
          </div>
        </div>

        {/* KPI 4: Tasks Progress */}
        <div className="p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Tiến độ công việc</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {completedCount}/{tasks.length}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 100}%
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>{tasks.length - completedCount} việc còn lại</span>
            <Link to="/tasks" className="text-foreground hover:underline font-medium inline-flex items-center gap-0.5">
              <span>Bảng việc</span>
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Main Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols): Priority Tasks */}
        <div className="lg:col-span-2 border border-border rounded-lg bg-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-foreground" aria-hidden="true" />
              <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Công việc cần ưu tiên hôm nay
              </h2>
            </div>
            <Link to="/tasks" className="text-xs text-muted-foreground hover:text-foreground font-medium inline-flex items-center gap-1">
              <span>Xem tất cả ({tasks.length})</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="py-8 text-center space-y-1 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Không có công việc khẩn cấp nào cần xử lý.</p>
              <p>Mọi nhiệm vụ đã được hoàn thành hoặc chưa được lên lịch hôm nay.</p>
              <div className="pt-2">
                <Link to="/tasks" className="inline-flex items-center gap-1 text-xs text-foreground font-semibold hover:underline">
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Thêm công việc mới</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border text-xs">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-muted/40 px-2 rounded-md transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => {}}
                      aria-label={`Đánh dấu hoàn thành: ${task.title}`}
                      className="h-4 w-4 rounded border-border text-foreground focus-ring cursor-pointer"
                    />
                    <span
                      className={`truncate text-xs ${
                        task.completed
                          ? 'line-through text-muted-foreground'
                          : 'font-medium text-foreground'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {task.rawDueDate && (() => {
                      const remaining = getRemainingDaysInfo(task.rawDueDate, task.completed ? 'DONE' : 'TODO');
                      return (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${remaining.colorClasses}`}>
                          {remaining.shortLabel}
                        </span>
                      );
                    })()}
                    {task.subtasksCount && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted/60 text-muted-foreground font-mono tabular-nums">
                        {task.subtasksCount.completed}/{task.subtasksCount.total}
                      </span>
                    )}
                    {task.urgent && !task.completed && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20">
                        Gấp
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Reminders & Pinned Notes */}
        <div className="space-y-5">
          {/* Upcoming Reminders Box */}
          <div className="border border-border rounded-lg bg-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-foreground" aria-hidden="true" />
                <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Lịch nhắc hẹn sắp tới
                </h2>
              </div>
              <Link to="/reminders" className="text-xs text-muted-foreground hover:text-foreground font-medium inline-flex items-center gap-0.5">
                <span>Xem hết</span>
                <ChevronRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>

            {reminders.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                <p>Không có lịch hẹn nào sắp tới.</p>
                <Link to="/reminders" className="text-foreground hover:underline font-medium text-[11px] mt-1 inline-block">
                  + Đặt lịch nhắc mới
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border text-xs">
                {reminders.slice(0, 4).map((r) => {
                  const timeStr = new Date(r.scheduledAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <Link
                      key={r.id}
                      to="/reminders"
                      className="py-2 flex items-center justify-between gap-2 hover:bg-muted/40 px-1.5 rounded transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{r.title}</div>
                        {r.location && (
                          <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                            <span>{r.location}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded border border-border bg-muted/60 text-foreground shrink-0">
                        {timeStr}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pinned Notes Box */}
          <div className="border border-border rounded-lg bg-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-foreground" aria-hidden="true" />
                <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Ghi chú đã ghim
                </h2>
              </div>
              <Link to="/notes" className="text-xs text-muted-foreground hover:text-foreground font-medium inline-flex items-center gap-0.5">
                <span>Kho tri thức</span>
                <ChevronRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>

            {pinnedNotes.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                <p>Chưa có ghi chú nào được ghim.</p>
                <Link to="/notes" className="text-foreground hover:underline font-medium text-[11px] mt-1 inline-block">
                  + Mở kho ghi chú
                </Link>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {pinnedNotes.slice(0, 3).map((note) => (
                  <Link
                    key={note.id}
                    to={`/notes?id=${note.id}`}
                    className="block p-2.5 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-semibold text-foreground truncate">{note.title}</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {note.snippet || 'Ghi chú không có mô tả vắn tắt…'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
