import React, { useState, useRef, useEffect } from 'react';
import {
  Clock,
  Edit3,
  Trash2,
  Check,
  AlertTriangle,
  MoreHorizontal,
  ArrowRight,
  ListTodo,
} from 'lucide-react';
import { Tooltip } from '../../common/Tooltip';
import { TaskItem } from '../CompositeTaskRow';
import { PriorityBadge } from '../PriorityBadge';
import { getScheduleDeadlineComparison } from '../../../lib/taskUtils';

interface PlannerTaskCardProps {
  task: TaskItem;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onToggleStatus: (taskId: string) => void;
  onEditTask: (task: TaskItem, e?: React.MouseEvent) => void;
  onDeleteTask: (taskId: string, e?: React.MouseEvent) => void;
  onReschedule: (taskId: string, targetDateStr: string | null) => void;
  getTagColor: (tag: string) => string;
}

export const PlannerTaskCard = React.memo<PlannerTaskCardProps>(({
  task,
  isDragging,
  onDragStart,
  onDragEnd,
  onToggleStatus,
  onEditTask,
  onDeleteTask,
  onReschedule,
  getTagColor,
}) => {
  const isDone = task.status === 'DONE';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Subtask progress calculation
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((st) => st.isCompleted).length || 0;

  // Deadline comparison with scheduled date
  const comparison = getScheduleDeadlineComparison(task.rawScheduledDate, task.rawDueDate);

  // Quick reschedule presets
  const handleQuickReschedule = (preset: 'today' | 'tomorrow' | 'next_monday' | 'unschedule') => {
    setIsMenuOpen(false);
    if (preset === 'unschedule') {
      onReschedule(task.id, null);
      return;
    }

    const now = new Date();
    let target = new Date();
    if (preset === 'today') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (preset === 'tomorrow') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (preset === 'next_monday') {
      const day = now.getDay();
      const diffToMonday = ((8 - day) % 7) || 7;
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateKey = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
    onReschedule(task.id, new Date(`${dateKey}T00:00:00.000Z`).toISOString());
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      className={`group relative p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-brand/40 dark:hover:border-brand/40 transition-all select-none cursor-grab active:cursor-grabbing space-y-2 ${
        isDragging ? 'opacity-30 scale-95 ring-2 ring-brand border-brand' : ''
      } ${isDone ? 'bg-slate-50/60 dark:bg-slate-900/40 opacity-70' : ''}`}
    >
      {/* Top Header: Checkbox + Priority + Action Buttons */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(task.id);
            }}
            aria-label={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu đã hoàn thành'}
            className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all cursor-pointer flex-shrink-0 focus-ring ${
              isDone
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-300 dark:border-slate-700 hover:border-brand text-transparent hover:text-brand/40'
            }`}
          >
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </button>
          <PriorityBadge priority={task.priority} />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Tooltip content="Chỉnh sửa công việc">
            <button
              type="button"
              onClick={(e) => onEditTask(task, e)}
              className="p-1 rounded-md text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </Tooltip>

          {/* Quick Reschedule Menu (Touch/Mobile & fast access) */}
          <div className="relative" ref={menuRef}>
            <Tooltip content="Dời lịch công việc">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isMenuOpen
                    ? 'bg-brand/10 text-brand'
                    : 'text-slate-400 hover:text-brand hover:bg-brand/10'
                }`}
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </Tooltip>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 text-[11px] space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Dời ngày làm việc
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickReschedule('today')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                >
                  <span>Hôm nay</span>
                  <span className="text-[10px] text-brand font-medium">Hôm nay</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickReschedule('tomorrow')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                >
                  <span>Ngày mai</span>
                  <span className="text-[10px] text-slate-400">+1d</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickReschedule('next_monday')}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                >
                  <span>Thứ 2 tuần sau</span>
                  <span className="text-[10px] text-slate-400">T2 tới</span>
                </button>
                {task.rawScheduledDate && (
                  <button
                    type="button"
                    onClick={() => handleQuickReschedule('unschedule')}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-between cursor-pointer border-t border-slate-100 dark:border-slate-800 mt-1 pt-1"
                  >
                    <span>Bỏ xếp lịch</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                )}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      setIsMenuOpen(false);
                      onDeleteTask(task.id, e);
                    }}
                    className="w-full text-left px-2 py-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Xóa việc</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Title */}
      <h4
        className={`text-xs font-semibold leading-snug line-clamp-2 ${
          isDone
            ? 'line-through text-slate-400 dark:text-slate-500'
            : 'text-slate-800 dark:text-slate-100'
        }`}
        title={task.title}
      >
        {task.title}
      </h4>

      {/* Smart Deadline Indicator vs Scheduled Date */}
      {task.rawDueDate && (
        <Tooltip content={comparison.tooltipText}>
          <div
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border font-medium ${comparison.badgeClasses}`}
          >
            {comparison.status === 'after_due' ? (
              <AlertTriangle className="w-2.5 h-2.5 text-rose-500 animate-bounce flex-shrink-0" />
            ) : (
              <Clock className="w-2.5 h-2.5 flex-shrink-0" />
            )}
            <span>{comparison.badgeLabel}</span>
          </div>
        </Tooltip>
      )}

      {/* Subtasks pill if present */}
      {totalSubtasks > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <ListTodo className="w-3 h-3 text-brand" />
          <span>
            {completedSubtasks}/{totalSubtasks} việc con
          </span>
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden ml-1">
            <div
              className={`h-full transition-all duration-300 ${
                completedSubtasks === totalSubtasks
                  ? 'bg-emerald-500'
                  : 'bg-brand'
              }`}
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          {task.tags.map((tag) => {
            const color = getTagColor(tag);
            return (
              <span
                key={tag}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border"
                style={{
                  backgroundColor: `${color}15`,
                  borderColor: `${color}35`,
                  color: color,
                }}
              >
                #{tag}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
});

PlannerTaskCard.displayName = 'PlannerTaskCard';
