import React from 'react';
import { Clock, Edit3, Trash2 } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';
import { getRemainingDaysInfo } from '../../lib/taskUtils';
import { PriorityBadge } from './PriorityBadge';
import { TaskItem } from './CompositeTaskRow';

interface KanbanTaskCardProps {
  task: TaskItem;
  isDragging: boolean;
  isDescriptionExpanded: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onToggleParentStatus: (taskId: string) => void;
  onToggleDescriptionExpand: (taskId: string, e?: React.MouseEvent) => void;
  onEditTask: (task: TaskItem, e?: React.MouseEvent) => void;
  onDeleteTask: (taskId: string, e?: React.MouseEvent) => void;
  getTagColor: (tag: string) => string;
}

export const KanbanTaskCard = React.memo<KanbanTaskCardProps>(({
  task,
  isDragging,
  isDescriptionExpanded,
  onDragStart,
  onDragEnd,
  onToggleParentStatus,
  onToggleDescriptionExpand,
  onEditTask,
  onDeleteTask,
  getTagColor,
}) => {
  const isDone = task.status === 'DONE';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={() => onToggleParentStatus(task.id)}
      className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover-lift cursor-grab active:cursor-grabbing space-y-2.5 transition-all select-none ${
        isDragging ? 'opacity-40 scale-95 border-brand ring-2 ring-brand/30' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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

      <div
        className={`font-semibold text-xs leading-snug ${
          isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
        }`}
      >
        {task.title}
      </div>

      {task.description && (
        <div
          onClick={(e) => onToggleDescriptionExpand(task.id, e)}
          className="cursor-pointer"
        >
          {isDescriptionExpanded ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 select-text leading-relaxed whitespace-pre-wrap break-words mt-1 shadow-xs"
            >
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold mb-1 pb-1 border-b border-slate-200/50 dark:border-slate-800">
                <span>Mô tả chi tiết</span>
                <button
                  type="button"
                  onClick={(e) => onToggleDescriptionExpand(task.id, e)}
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

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-1">
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
    </div>
  );
});

KanbanTaskCard.displayName = 'KanbanTaskCard';
