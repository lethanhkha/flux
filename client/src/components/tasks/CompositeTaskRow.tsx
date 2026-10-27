import React, { useState } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Clock,
  Repeat,
  ChevronDown,
  ChevronUp,
  AlignLeft,
  Edit3,
  Trash2,
  ListTree,
  Sparkles,
} from 'lucide-react';
import { Tooltip } from '../common/Tooltip';
import { getRemainingDaysInfo, getSubtaskProgressConfig } from '../../lib/taskUtils';
import { SubtaskItem } from './SubtaskList';
import { PriorityBadge } from './PriorityBadge';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  rawDueDate?: string | null;
  scheduledDate?: string | null;
  rawScheduledDate?: string | null;
  isRecurring: boolean;
  recurrenceRule?: string;
  rawRecurrenceRule?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null;
  tags?: string[];
  subtasks?: SubtaskItem[];
}

interface CompositeTaskRowProps {
  task: TaskItem;
  isDescriptionExpanded: boolean;
  onToggleParentStatus: (taskId: string, e?: React.MouseEvent) => void;
  onToggleSubtask: (taskId: string, subtaskId: string, e: React.MouseEvent) => void;
  onEditTask: (task: TaskItem, e: React.MouseEvent) => void;
  onDeleteTask: (taskId: string, e: React.MouseEvent) => void;
  getTagColor: (tag: string) => string;
  toggleDescriptionExpand: (taskId: string, e?: React.MouseEvent) => void;
}

export const CompositeTaskRow = React.memo<CompositeTaskRowProps>(({
  task,
  isDescriptionExpanded,
  onToggleParentStatus,
  onToggleSubtask,
  onEditTask,
  onDeleteTask,
  getTagColor,
  toggleDescriptionExpand,
}) => {
  const [isSubtasksCollapsed, setIsSubtasksCollapsed] = useState(false);

  const subtasks = task.subtasks || [];
  const total = subtasks.length;
  const completed = subtasks.filter((s) => s.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isAllCompleted = total > 0 && completed === total;
  const isDone = task.status === 'DONE';
  const progressConfig = getSubtaskProgressConfig(percentage);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isDone
          ? 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-200/80 dark:border-slate-800/80 opacity-75 border-l-4 border-l-emerald-500'
          : isAllCompleted
          ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800/60 border-l-4 border-l-emerald-500 shadow-sm'
          : `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 border-l-4 ${progressConfig.borderLeftAccent} hover:border-slate-300 dark:hover:border-slate-700 shadow-sm`
      }`}
    >
      {/* Top Banner: Composite Badge + Parent Action Header */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* Row 1: Header tags, type indicator, and actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Multi-step Composite Task Badge */}
            <Tooltip content="Công việc có nhiều bước thực hiện (Sub-tasks). Khi hoàn thành đủ 100% việc con, hệ thống sẽ tự động đánh dấu công việc này hoàn thành.">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-brand/10 text-brand border border-brand/20 cursor-help select-none">
                <ListTree className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Nhiệm vụ đa bước ({total} việc con)</span>
              </span>
            </Tooltip>

            {/* Recurring Rule Badge */}
            {task.isRecurring && (
              <Tooltip content={`Chu kỳ lặp lại: ${task.recurrenceRule || 'Định kỳ'}`}>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-semibold cursor-help">
                  <Repeat className="w-2.5 h-2.5" /> {task.recurrenceRule}
                </span>
              </Tooltip>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {task.tags.map((tag) => {
                  const color = getTagColor(tag);
                  return (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border"
                      style={{
                        backgroundColor: `${color}15`,
                        borderColor: `${color}35`,
                        color: color,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      #{tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            <PriorityBadge priority={task.priority} />

            {/* Deadline Countdown Badge */}
            {task.rawDueDate && (() => {
              const remaining = getRemainingDaysInfo(task.rawDueDate, task.status);
              return (
                <Tooltip content={`Hạn chót: ${remaining.formattedDue}`}>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md border font-medium flex items-center gap-1 transition-all ${remaining.colorClasses}`}
                  >
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>{remaining.label}</span>
                  </span>
                </Tooltip>
              );
            })()}

            {/* Action buttons */}
            <div className="flex items-center gap-1 pl-1">
              <Tooltip content="Chỉnh sửa nội dung, danh sách việc con, thời hạn và phân loại">
                <button
                  type="button"
                  onClick={(e) => onEditTask(task, e)}
                  aria-label={`Chỉnh sửa công việc: ${task.title}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors focus-ring cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Xóa công việc này cùng toàn bộ các việc con liên quan">
                <button
                  type="button"
                  onClick={(e) => onDeleteTask(task.id, e)}
                  aria-label={`Xóa công việc: ${task.title}`}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors focus-ring cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Row 2: Parent Task Title with Big Master Checkbox */}
        <div className="flex items-start gap-3.5 pt-1">
          <Tooltip
            content={
              isDone
                ? 'Công việc đã hoàn thành. Bấm để mở lại và chuyển về trạng thái đang làm.'
                : 'Bấm để đánh dấu hoàn thành toàn bộ công việc và toàn bộ việc con.'
            }
          >
            <button
              type="button"
              onClick={(e) => onToggleParentStatus(task.id, e)}
              className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-brand transition-colors cursor-pointer focus-ring rounded"
              aria-label={`Đổi trạng thái toàn bộ công việc: ${task.title}`}
            >
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 hover:scale-110 transition-transform" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-brand hover:scale-110 transition-transform" />
              )}
            </button>
          </Tooltip>

          <div className="flex-1 min-w-0">
            <h3
              onClick={(e) => onToggleParentStatus(task.id, e)}
              className={`font-bold text-sm sm:text-base leading-snug cursor-pointer transition-colors ${
                isDone
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100 hover:text-brand dark:hover:text-brand'
              }`}
            >
              {task.title}
            </h3>

            {/* Description */}
            {task.description && (
              <div className="mt-1">
                {isDescriptionExpanded ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 select-text leading-relaxed whitespace-pre-wrap break-words mt-1 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-slate-200/60 dark:border-slate-800 text-[10px] font-semibold text-slate-400">
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <AlignLeft className="w-3 h-3 text-brand" /> Chi tiết công việc
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleDescriptionExpand(task.id, e)}
                        className="inline-flex items-center gap-0.5 text-brand hover:underline cursor-pointer font-medium"
                      >
                        Thu gọn <ChevronUp className="w-3 h-3" />
                      </button>
                    </div>
                    {task.description}
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5">
                    <p
                      onClick={(e) => toggleDescriptionExpand(task.id, e)}
                      title={task.description}
                      className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors flex-1"
                    >
                      {task.description}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => toggleDescriptionExpand(task.id, e)}
                      title="Bấm để xem toàn bộ mô tả"
                      className="inline-flex items-center gap-0.5 text-[11px] font-medium text-brand hover:underline cursor-pointer flex-shrink-0"
                    >
                      Xem thêm <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Prominent Multi-tier Progress Bar with Stats */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <Tooltip content="Tiến trình thực hiện: Tự động cập nhật tức thì khi bạn tick từng việc con. Đạt 100% sẽ tự động hoàn thành công việc.">
              <div className="flex items-center gap-2 cursor-help font-semibold text-slate-700 dark:text-slate-300">
                <CheckSquare className={`w-4 h-4 ${progressConfig.badgeText}`} />
                <span>Tiến độ thực hiện:</span>
                <span className={`font-bold tabular-nums ${progressConfig.badgeText}`}>
                  {completed}/{total} việc con ({percentage}%)
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${progressConfig.badgeBg}`}>
                  {progressConfig.stageLabel}
                </span>
              </div>
            </Tooltip>

            <div className="flex items-center gap-2">
              {percentage === 100 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>Đạt 100% — Tự động hoàn thành</span>
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-400">
                  Còn {total - completed} việc chưa xong
                </span>
              )}

              {/* Collapse/Expand Toggle */}
              <Tooltip content={isSubtasksCollapsed ? 'Mở rộng cây danh sách việc con' : 'Thu gọn danh sách việc con'}>
                <button
                  type="button"
                  onClick={() => setIsSubtasksCollapsed(!isSubtasksCollapsed)}
                  className="p-1 rounded text-slate-400 hover:text-brand hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-0.5 font-medium"
                >
                  <span>{isSubtasksCollapsed ? 'Mở rộng' : 'Thu gọn'}</span>
                  {isSubtasksCollapsed ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>

          {/* High-contrast Multi-tier Progress Bar */}
          <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-inner p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${progressConfig.barGradient}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Row 4: Subtasks Tree View (Visible by default) */}
        {!isSubtasksCollapsed && (
          <div className="pt-1">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <span>Danh sách các việc con tuần tự:</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (Click vào checkbox để tick xong từng bước)
              </span>
            </div>

            {/* Tree Branch Container */}
            <div className="ml-3 sm:ml-4 pl-3.5 border-l-2 border-indigo-200 dark:border-indigo-900/50 space-y-2">
              {subtasks.map((st, idx) => (
                <div
                  key={st.id}
                  onClick={(e) => onToggleSubtask(task.id, st.id, e)}
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer group ${
                    st.isCompleted
                      ? 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/60 opacity-80'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand/50 hover:bg-slate-50/80 dark:hover:bg-slate-850 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Step number */}
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 tabular-nums ${
                        st.isCompleted
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {/* Subtask Checkbox */}
                    <Tooltip
                      content={
                        st.isCompleted
                          ? `Đã xong: "${st.title}". Bấm để hoàn tác.`
                          : `Bấm để hoàn thành việc con "${st.title}" (Tự động cập nhật thanh tiến trình).`
                      }
                    >
                      <button
                        type="button"
                        className="flex-shrink-0 text-slate-400 hover:text-brand focus-ring rounded"
                        aria-label={`Đổi trạng thái việc con: ${st.title}`}
                      >
                        {st.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-brand group-hover:scale-110 transition-transform" />
                        )}
                      </button>
                    </Tooltip>

                    {/* Subtask Title */}
                    <span
                      className={`text-xs font-medium truncate ${
                        st.isCompleted
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200 group-hover:text-brand transition-colors'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {st.isCompleted ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex-shrink-0 flex items-center gap-1">
                      <span>✓ Đã xong</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-500 flex-shrink-0">
                      Chờ thực hiện
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

CompositeTaskRow.displayName = 'CompositeTaskRow';
