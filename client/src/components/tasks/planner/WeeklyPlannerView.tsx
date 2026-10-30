import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Inbox,
  SlidersHorizontal,
  EyeOff,
} from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  isSameDay,
  isSameWeek,
  isToday as checkIsToday,
  format,
  differenceInCalendarDays,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { apiClient, getErrorMessage } from '../../../api/client';
import { TaskItem } from '../CompositeTaskRow';
import { PlannerDayColumn } from './PlannerDayColumn';
import { PlannerUnscheduledColumn } from './PlannerUnscheduledColumn';
import { PlannerRangeModal } from './PlannerRangeModal';
import { Tooltip } from '../../common/Tooltip';
import { useHorizontalScroll } from '../../../hooks/useHorizontalScroll';

interface WeeklyPlannerViewProps {
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  onToggleStatus: (taskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenAddModalWithDate?: (date: Date) => void;
  getTagColor: (tag: string) => string;
}

type PlannerPreset = '7days_week' | 'work_week' | 'next_7days' | 'custom';

export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  tasks,
  setTasks,
  onToggleStatus,
  onEditTask,
  onDeleteTask,
  onOpenAddModalWithDate,
  getTagColor,
}) => {
  // Navigation & Date Range state
  const [currentReferenceDate, setCurrentReferenceDate] = useState<Date>(() => new Date());
  const [activePreset, setActivePreset] = useState<PlannerPreset>('7days_week');
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);

  // Unscheduled Column collapse state
  const [isBacklogCollapsed, setIsBacklogCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('flux_planner_backlog_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleBacklogCollapse = useCallback(() => {
    setIsBacklogCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('flux_planner_backlog_collapsed', String(next));
      } catch {
        // Safe ignore
      }
      return next;
    });
  }, []);

  // Drag and Drop state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | 'unscheduled' | null>(null);

  // Option to hide past days of the current week
  const [hidePastDays, setHidePastDays] = useState<boolean>(() => {
    try {
      return localStorage.getItem('flux_planner_hide_past_days') === 'true';
    } catch {
      return false;
    }
  });

  const toggleHidePastDays = useCallback(() => {
    setHidePastDays((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('flux_planner_hide_past_days', String(next));
      } catch {
        // Safe ignore
      }
      return next;
    });
  }, []);

  // Calculate day columns based on active preset & reference date
  const {
    rangeStart,
    rangeEnd,
    dayList,
    hiddenPastDayKeys,
    hiddenDayLabels,
    isCurrentWeek,
  } = useMemo(() => {
    let start: Date;
    let end: Date;

    if (activePreset === 'custom' && customRange) {
      start = customRange.start;
      end = customRange.end;
    } else if (activePreset === 'work_week') {
      start = startOfWeek(currentReferenceDate, { weekStartsOn: 1 });
      end = addDays(start, 4); // Mon to Fri
    } else if (activePreset === 'next_7days') {
      start = currentReferenceDate;
      end = addDays(currentReferenceDate, 6);
    } else {
      // '7days_week' (Mon to Sun)
      start = startOfWeek(currentReferenceDate, { weekStartsOn: 1 });
      end = endOfWeek(currentReferenceDate, { weekStartsOn: 1 });
    }

    const count = Math.min(differenceInCalendarDays(end, start) + 1, 14);
    const fullList: { date: Date; dateKey: string; isToday: boolean }[] = [];
    const pad = (n: number) => n.toString().padStart(2, '0');

    for (let i = 0; i < count; i++) {
      const d = addDays(start, i);
      const dateKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      fullList.push({
        date: d,
        dateKey,
        isToday: checkIsToday(d),
      });
    }

    const today = new Date();
    const isThisWeek = isSameWeek(currentReferenceDate, today, { weekStartsOn: 1 });

    const hiddenKeys = new Set<string>();
    const hiddenLabels: string[] = [];

    // Filter out past days of current week if hidePastDays is enabled
    const visibleList = fullList.filter((item) => {
      const isPastDayOfCurrentWeek =
        isThisWeek && differenceInCalendarDays(item.date, today) < 0;

      if (hidePastDays && isPastDayOfCurrentWeek) {
        hiddenKeys.add(item.dateKey);
        const dayOfWeek = item.date.getDay();
        const shortName = dayOfWeek === 0 ? 'CN' : `T${dayOfWeek + 1}`;
        hiddenLabels.push(shortName);
        return false;
      }
      return true;
    });

    return {
      rangeStart: start,
      rangeEnd: end,
      dayList: visibleList,
      hiddenPastDayKeys: hiddenKeys,
      hiddenDayLabels: hiddenLabels,
      isCurrentWeek: isThisWeek,
    };
  }, [currentReferenceDate, activePreset, customRange, hidePastDays]);

  // Group tasks into unscheduled vs each day
  const { unscheduledTasks, dayTasksMap } = useMemo(() => {
    const unscheduled: TaskItem[] = [];
    const dayMap = new Map<string, TaskItem[]>();

    // Initialize day map keys for visible days
    dayList.forEach((d) => {
      dayMap.set(d.dateKey, []);
    });

    tasks.forEach((t) => {
      if (!t.rawScheduledDate) {
        unscheduled.push(t);
      } else {
        const sched = new Date(t.rawScheduledDate);
        if (isNaN(sched.getTime())) {
          unscheduled.push(t);
        } else {
          const pad = (n: number) => n.toString().padStart(2, '0');
          const key = `${sched.getFullYear()}-${pad(sched.getMonth() + 1)}-${pad(sched.getDate())}`;
          const existing = dayMap.get(key);
          if (existing) {
            existing.push(t);
          } else if (hiddenPastDayKeys.has(key)) {
            // Task is scheduled on a hidden past day of current week: do NOT push to unscheduled
          } else {
            // Scheduled outside the active view range
            unscheduled.push(t);
          }
        }
      }
    });

    return { unscheduledTasks: unscheduled, dayTasksMap: dayMap };
  }, [tasks, dayList, hiddenPastDayKeys]);

  // Navigation handlers
  const handlePrevWeek = () => {
    if (activePreset === 'custom') {
      const diff = differenceInCalendarDays(rangeEnd, rangeStart) + 1;
      setCustomRange({
        start: subDays(rangeStart, diff),
        end: subDays(rangeEnd, diff),
      });
    } else {
      setCurrentReferenceDate((prev) => subDays(prev, 7));
    }
  };

  const handleNextWeek = () => {
    if (activePreset === 'custom') {
      const diff = differenceInCalendarDays(rangeEnd, rangeStart) + 1;
      setCustomRange({
        start: addDays(rangeStart, diff),
        end: addDays(rangeEnd, diff),
      });
    } else {
      setCurrentReferenceDate((prev) => addDays(prev, 7));
    }
  };

  const handleToday = () => {
    setCurrentReferenceDate(new Date());
    if (activePreset === 'custom') {
      setActivePreset('7days_week');
      setCustomRange(null);
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnKey: string | 'unscheduled') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn((prev) => (prev !== columnKey ? columnKey : prev));
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  // Core reschedule API + optimistic state updater
  const handleReschedule = useCallback(
    async (taskId: string, targetDateIsoOrNull: string | null) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const prevRaw = targetTask.rawScheduledDate;
      const prevDisplay = targetTask.scheduledDate;

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                rawScheduledDate: targetDateIsoOrNull,
                scheduledDate: targetDateIsoOrNull
                  ? new Date(targetDateIsoOrNull).toLocaleDateString('vi-VN')
                  : null,
              }
            : t
        )
      );

      try {
        await apiClient.patch(`/tasks/${taskId}`, {
          scheduledDate: targetDateIsoOrNull,
        });

        if (targetDateIsoOrNull) {
          const d = new Date(targetDateIsoOrNull);
          const dayStr = format(d, 'EEEE, dd/MM', { locale: vi });
          toast.success(`Đã xếp lịch: "${targetTask.title}" vào ${dayStr}`);
        } else {
          toast.info(`Đã chuyển: "${targetTask.title}" về Hộp việc chưa xếp`);
        }
      } catch (err) {
        // Rollback on error
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  rawScheduledDate: prevRaw,
                  scheduledDate: prevDisplay,
                }
              : t
          )
        );
        toast.error(getErrorMessage(err, 'Không thể cập nhật ngày làm việc.'));
      }
    },
    [tasks, setTasks]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetColumnKey: string | 'unscheduled') => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
      setDraggingTaskId(null);
      setDragOverColumn(null);

      if (!taskId) return;

      if (targetColumnKey === 'unscheduled') {
        handleReschedule(taskId, null);
      } else {
        const targetIso = new Date(`${targetColumnKey}T00:00:00.000Z`).toISOString();
        handleReschedule(taskId, targetIso);
      }
    },
    [draggingTaskId, handleReschedule]
  );

  const handleQuickAdd = useCallback(
    (date?: Date) => {
      if (onOpenAddModalWithDate && date) {
        onOpenAddModalWithDate(date);
      } else if (onOpenAddModalWithDate) {
        onOpenAddModalWithDate(new Date());
      }
    },
    [onOpenAddModalWithDate]
  );

  // Range text formatting
  const rangeTitle = useMemo(() => {
    const sStr = format(rangeStart, 'dd/MM/yyyy');
    const eStr = format(rangeEnd, 'dd/MM/yyyy');
    if (activePreset === '7days_week' && isSameDay(rangeStart, startOfWeek(new Date(), { weekStartsOn: 1 }))) {
      return `Tuần này (${format(rangeStart, 'dd/MM')} – ${format(rangeEnd, 'dd/MM')})`;
    }
    return `${sStr} – ${eStr}`;
  }, [rangeStart, rangeEnd, activePreset]);

  // Use horizontal scroll hook on the days container
  const scrollRef = useHorizontalScroll();

  return (
    <div className="space-y-4">
      {/* Top Header Controls: Navigation + Presets */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-3xl shadow-xs">
        {/* Week navigation buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <Tooltip content="Khoảng thời gian trước">
              <button
                type="button"
                onClick={handlePrevWeek}
                aria-label="Khoảng thời gian trước"
                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 hover:text-brand hover:shadow-xs transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </Tooltip>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-brand cursor-pointer transition-colors"
            >
              Hôm nay
            </button>
            <Tooltip content="Khoảng thời gian kế tiếp">
              <button
                type="button"
                onClick={handleNextWeek}
                aria-label="Khoảng thời gian kế tiếp"
                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 hover:text-brand hover:shadow-xs transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2 pl-1">
            <CalendarIcon className="w-4 h-4 text-brand" />
            <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
              {rangeTitle}
            </span>
          </div>
        </div>

        {/* View Presets & Backlog Toggle */}
        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
          {/* Presets segment */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-[11px] font-medium">
            <button
              type="button"
              onClick={() => {
                setActivePreset('7days_week');
                setCustomRange(null);
              }}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                activePreset === '7days_week'
                  ? 'bg-white dark:bg-slate-900 text-brand shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Cả tuần (7 ngày)
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePreset('work_week');
                setCustomRange(null);
              }}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                activePreset === 'work_week'
                  ? 'bg-white dark:bg-slate-900 text-brand shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Ngày làm việc (T2-T6)
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePreset('next_7days');
                setCustomRange(null);
              }}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                activePreset === 'next_7days'
                  ? 'bg-white dark:bg-slate-900 text-brand shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              7 ngày tới
            </button>
          </div>

          {/* Custom range button */}
          <Tooltip content="Chọn khoảng ngày tùy chỉnh (tối đa 14 ngày)">
            <button
              type="button"
              onClick={() => setIsRangeModalOpen(true)}
              className={`px-3 py-1.5 rounded-2xl border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                activePreset === 'custom'
                  ? 'border-brand bg-brand/10 text-brand font-bold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand hover:text-brand'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Tùy chỉnh</span>
            </button>
          </Tooltip>

          {/* Hide past days toggle button */}
          <Tooltip content="Ẩn các ngày đã qua của tuần hiện tại (ví dụ: Thứ 2 - Thứ 4 khi hôm nay là Thứ 5)">
            <button
              type="button"
              onClick={toggleHidePastDays}
              className={`px-3 py-1.5 rounded-2xl border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                hidePastDays && isCurrentWeek
                  ? 'border-brand bg-brand/10 text-brand font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand/40 hover:text-brand'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Ẩn ngày đã qua</span>
              {hiddenDayLabels.length > 0 && hidePastDays && isCurrentWeek && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-brand text-white font-bold leading-none">
                  {hiddenDayLabels.length}
                </span>
              )}
            </button>
          </Tooltip>

          {/* Toggle Backlog Button (when collapsed) */}
          {isBacklogCollapsed && (
            <Tooltip content="Mở hộp việc chưa xếp lịch">
              <button
                type="button"
                onClick={toggleBacklogCollapse}
                className="px-3 py-1.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-amber-500/20 transition-all"
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Chưa xếp ({unscheduledTasks.length})</span>
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Banner hint when past days of the current week are hidden */}
      {hiddenDayLabels.length > 0 && hidePastDays && isCurrentWeek && (
        <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-brand/5 dark:bg-brand/10 border border-brand/20 text-xs text-brand">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 shrink-0" />
            <span>
              Đang ẩn <strong>{hiddenDayLabels.length} ngày</strong> đã qua của tuần này ({hiddenDayLabels.join(', ')}).
            </span>
          </div>
          <button
            type="button"
            onClick={toggleHidePastDays}
            className="text-xs font-bold underline hover:text-brand-hover cursor-pointer"
          >
            Hiện lại tất cả ngày
          </button>
        </div>
      )}

      {/* Main Board Layout: Split between Backlog & Days Grid */}
      <div className="flex items-start gap-3.5 overflow-hidden">
        {/* Left: Unscheduled Tasks Column */}
        <PlannerUnscheduledColumn
          tasks={unscheduledTasks}
          isCollapsed={isBacklogCollapsed}
          onToggleCollapse={toggleBacklogCollapse}
          isDragOver={dragOverColumn === 'unscheduled'}
          draggingTaskId={draggingTaskId}
          onDragOver={(e) => handleDragOver(e, 'unscheduled')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'unscheduled')}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onToggleStatus={onToggleStatus}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onReschedule={handleReschedule}
          onQuickAdd={() => handleQuickAdd(undefined)}
          getTagColor={getTagColor}
        />

        {/* Right: Days Columns Container with Horizontal Scroll */}
        <div
          ref={scrollRef}
          className="flex-1 flex gap-3 overflow-x-auto pb-4 pt-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
          style={{ scrollBehavior: 'smooth' }}
        >
          {dayList.map(({ date, dateKey, isToday }) => {
            const columnTasks = dayTasksMap.get(dateKey) || [];
            return (
              <PlannerDayColumn
                key={dateKey}
                date={date}
                dateKey={dateKey}
                tasks={columnTasks}
                isToday={isToday}
                isDragOver={dragOverColumn === dateKey}
                draggingTaskId={draggingTaskId}
                onDragOver={(e) => handleDragOver(e, dateKey)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dateKey)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onToggleStatus={onToggleStatus}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onReschedule={handleReschedule}
                onQuickAdd={handleQuickAdd}
                getTagColor={getTagColor}
              />
            );
          })}
        </div>
      </div>

      {/* Custom Range Selection Modal */}
      <PlannerRangeModal
        isOpen={isRangeModalOpen}
        onClose={() => setIsRangeModalOpen(false)}
        currentStartDate={rangeStart}
        currentEndDate={rangeEnd}
        onApplyRange={(start, end) => {
          setCustomRange({ start, end });
          setActivePreset('custom');
        }}
      />
    </div>
  );
};
