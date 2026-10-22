import React from 'react';
import {
  Repeat,
  AlignLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Tooltip } from '../common/Tooltip';
import { getRemainingDaysInfo } from '../../lib/taskUtils';
import { PriorityBadge } from './PriorityBadge';
import { TaskItem } from './CompositeTaskRow';

interface SimpleTaskRowProps {
  task: TaskItem;
  isDescriptionExpanded: boolean;
  onToggleTaskStatus: (taskId: string) => void;
  onToggleDescriptionExpand: (taskId: string, e?: React.MouseEvent) => void;
  onEditTask: (task: TaskItem, e?: React.MouseEvent) => void;
  onDeleteTask: (taskId: string, e?: React.MouseEvent) => void;
  getTagColor: (tag: string) => string;
}

export const SimpleTaskRow = React.memo<SimpleTaskRowProps>(({
  task,
  isDescriptionExpanded,
  onToggleTaskStatus,
  onToggleDescriptionExpand,
  onEditTask,
  onDeleteTask,
  getTagColor,
}) => {
  const isDone = task.status === 'DONE';

  return (
    <div
      onClick={() => onToggleTaskStatus(task.id)}
      className={`p-4 rounded-2xl border transition-all flex ${
        isDescriptionExpanded ? 'items-start' : 'items-start sm:items-center'
      } justify-between gap-4 cursor-pointer hover:border-brand/50 ${
        isDone
          ? 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800/80 opacity-70'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover-lift'
      }`}
    >
      <div className={`flex ${isDescriptionExpanded ? 'items-start' : 'items-start sm:items-center'} gap-3.5 flex-1 min-w-0`}>
        <Tooltip
          content={
            isDone
              ? 'Bấm để chuyển công việc về cần làm'
              : 'Bấm để đánh dấu hoàn thành công việc này'
          }
        >
          <input
            type="checkbox"
            checked={isDone}
            onChange={() => {}}
            className={`${isDescriptionExpanded ? 'mt-1' : 'mt-0.5 sm:mt-0'} w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer flex-shrink-0`}
          />
        </Tooltip>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold text-xs leading-snug truncate ${
                isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {task.title}
            </span>
            {task.isRecurring && (
              <Tooltip content={`Lặp lại: ${task.recurrenceRule}`}>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 flex-shrink-0 font-medium">
                  <Repeat className="w-2.5 h-2.5" /> {task.recurrenceRule}
                </span>
              </Tooltip>
            )}
          </div>

          {task.description && (
            <div className="mt-1">
              {isDescriptionExpanded ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 select-text leading-relaxed whitespace-pre-wrap break-words shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-slate-200/60 dark:border-slate-800 text-[10px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <AlignLeft className="w-3 h-3 text-brand" /> Chi tiết công việc
                    </span>
                    <button
                      type="button"
                      onClick={(e) => onToggleDescriptionExpand(task.id, e)}
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
                    onClick={(e) => onToggleDescriptionExpand(task.id, e)}
                    title={task.description}
                    className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors flex-1"
                  >
                    {task.description}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => onToggleDescriptionExpand(task.id, e)}
                    title="Bấm để xem toàn bộ mô tả"
                    className="inline-flex items-center gap-0.5 text-[10px] font-medium text-brand hover:underline cursor-pointer flex-shrink-0"
                  >
                    Xem thêm <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              {task.tags.map((tag) => {
                const color = getTagColor(tag);
                return (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border"
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
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0">
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

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Tooltip content="Chỉnh sửa nội dung, thời hạn và trạng thái công việc">
            <button
              type="button"
              onClick={(e) => onEditTask(task, e)}
              aria-label={`Chỉnh sửa công việc: ${task.title}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors focus-ring cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip content="Xóa công việc này khỏi hệ thống">
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
  );
});

SimpleTaskRow.displayName = 'SimpleTaskRow';
