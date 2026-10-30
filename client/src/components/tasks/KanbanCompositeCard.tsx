import React from 'react';
import {
  Clock,
  Edit3,
  Trash2,
  ListTree,
  CheckCircle2,
  Circle,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { Tooltip } from '../common/Tooltip';
import { getRemainingDaysInfo, getSubtaskProgressConfig } from '../../lib/taskUtils';
import { TaskItem } from './CompositeTaskRow';
import { PriorityBadge } from './PriorityBadge';

interface KanbanCompositeCardProps {
  task: TaskItem;
  isDragging: boolean;
  isDescriptionExpanded: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onToggleParentStatus: (taskId: string, e?: React.MouseEvent) => void;
  onToggleSubtask: (taskId: string, subtaskId: string, e: React.MouseEvent) => void;
  onEditTask: (task: TaskItem, e: React.MouseEvent) => void;
  onDeleteTask: (taskId: string, e: React.MouseEvent) => void;
  getTagColor: (tag: string) => string;
  toggleDescriptionExpand: (taskId: string, e?: React.MouseEvent) => void;
}

export const KanbanCompositeCard = React.memo<KanbanCompositeCardProps>(({
  task,
  isDragging,
  isDescriptionExpanded,
  onDragStart,
  onDragEnd,
  onToggleParentStatus,
  onToggleSubtask,
  onEditTask,
  onDeleteTask,
  getTagColor,
  toggleDescriptionExpand,
}) => {
  const subtasks = task.subtasks || [];
  const total = subtasks.length;
  const completed = subtasks.filter((s) => s.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isDone = task.status === 'DONE';
  const progressConfig = getSubtaskProgressConfig(percentage);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={() => onToggleParentStatus(task.id)}
      className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm hover-lift cursor-grab active:cursor-grabbing space-y-3 transition-all select-none overflow-hidden ${
        isDone
          ? 'border-slate-200 dark:border-slate-800 border-t-4 border-t-emerald-500 opacity-75'
          : percentage === 100
          ? 'border-emerald-300 dark:border-emerald-800 border-t-4 border-t-emerald-500 ring-2 ring-emerald-500/20'
          : `border-slate-200 dark:border-slate-800 border-t-4 ${progressConfig.borderTopAccent} hover:border-slate-300 dark:hover:border-slate-700`
      } ${
        isDragging ? 'opacity-40 scale-95 border-brand ring-2 ring-brand/30' : ''
      }`}
    >
      {/* Header Badges & Actions */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityBadge priority={task.priority} />

          <Tooltip content="Công việc có việc con cần thực hiện từng bước">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand/10 text-brand border border-brand/20 cursor-help">
              <ListTree className="w-3 h-3 flex-shrink-0" />
              <span>{total} việc con</span>
            </span>
          </Tooltip>

          {task.isRecurring && (
            <Tooltip content={`Lặp lại: ${task.recurrenceRule}`}>
              <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-medium">
                <Repeat className="w-2.5 h-2.5" /> {task.recurrenceRule}
              </span>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {task.rawDueDate && (() => {
            const remaining = getRemainingDaysInfo(task.rawDueDate, task.status);
            return (
              <Tooltip content={`Hạn chót: ${remaining.formattedDue}`}>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-1 ${remaining.colorClasses}`}
                >
                  <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                  <span>{remaining.shortLabel}</span>
                </span>
              </Tooltip>
            );
          })()}

          <Tooltip content="Chỉnh sửa công việc">
            <button
              type="button"
              onClick={(e) => onEditTask(task, e)}
              aria-label={`Chỉnh sửa công việc: ${task.title}`}
              className="text-slate-400 hover:text-brand hover:bg-brand/10 p-1 rounded-md transition-colors cursor-pointer focus-ring"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </Tooltip>
          <Tooltip content="Xóa công việc">
            <button
              type="button"
              onClick={(e) => onDeleteTask(task.id, e)}
              aria-label={`Xóa công việc: ${task.title}`}
              className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1 rounded-md transition-colors cursor-pointer focus-ring"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Task Title */}
      <div
        className={`font-bold text-xs sm:text-sm leading-snug ${
          isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {task.title}
      </div>

      {/* Task Description */}
      {task.description && (
        <div onClick={(e) => toggleDescriptionExpand(task.id, e)} className="cursor-pointer">
          {isDescriptionExpanded ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 select-text leading-relaxed whitespace-pre-wrap break-words mt-1 shadow-xs"
            >
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold mb-1 pb-1 border-b border-slate-200/50 dark:border-slate-800">
                <span>Mô tả chi tiết</span>
                <button
                  type="button"
                  onClick={(e) => toggleDescriptionExpand(task.id, e)}
                  className="text-brand hover:underline cursor-pointer font-medium"
                >
                  Thu gọn ▲
                </button>
              </div>
              {task.description}
            </div>
          ) : (
            <p
              title="Bấm để xem toàn bộ mô tả"
              className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {task.description}
            </p>
          )}
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
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border"
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

      {/* Prominent Multi-tier Progress Bar on Kanban Card */}
      <div
        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80 space-y-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between text-[11px] gap-1 flex-wrap">
          <Tooltip content={`Tiến độ: ${progressConfig.stageLabel}. Tự động cập nhật tức thì. Đạt 100% sẽ chuyển sang cột Đã hoàn thành.`}>
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-help">
              <span>Tiến độ:</span>
              <span className={`tabular-nums font-bold ${progressConfig.badgeText}`}>
                {completed}/{total} ({percentage}%)
              </span>
            </span>
          </Tooltip>

          {percentage === 100 ? (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 text-emerald-500" /> 100%
            </span>
          ) : (
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${progressConfig.badgeBg}`}>
              {progressConfig.stageLabel}
            </span>
          )}
        </div>

        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${progressConfig.barGradient}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Interactive Mini Checklist right on Kanban Card */}
        <div className="space-y-1 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
          {subtasks.map((st, idx) => (
            <div
              key={st.id}
              onClick={(e) => onToggleSubtask(task.id, st.id, e)}
              className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer group"
            >
              <Tooltip
                content={
                  st.isCompleted
                    ? `Đã xong: "${st.title}". Bấm để hoàn tác.`
                    : `Bấm để hoàn thành việc con "${st.title}" ngay trên Kanban.`
                }
              >
                <button
                  type="button"
                  className="flex-shrink-0 text-slate-400 hover:text-brand focus-ring rounded"
                  aria-label={`Đổi việc con: ${st.title}`}
                >
                  {st.isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-brand" />
                  )}
                </button>
              </Tooltip>

              <span className="text-[10px] text-slate-400 font-semibold tabular-nums flex-shrink-0">
                {idx + 1}.
              </span>

              <span
                className={`text-[11px] truncate flex-1 ${
                  st.isCompleted
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-700 dark:text-slate-200 font-medium group-hover:text-brand'
                }`}
              >
                {st.title}
              </span>

              {st.dueDate && (() => {
                const dueInfo = getRemainingDaysInfo(st.dueDate, st.isCompleted ? 'DONE' : 'TODO');
                return (
                  <Tooltip content={`Hạn chót: ${dueInfo.formattedDue}`}>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded border font-medium flex-shrink-0 flex items-center gap-0.5 ${
                        st.isCompleted
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          : dueInfo.colorClasses
                      }`}
                    >
                      <Clock className="w-2 h-2" />
                      <span>{dueInfo.shortLabel}</span>
                    </span>
                  </Tooltip>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

KanbanCompositeCard.displayName = 'KanbanCompositeCard';
