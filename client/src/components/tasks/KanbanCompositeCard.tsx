import React from 'react';
import {
  Clock,
  Edit3,
  Trash2,
  ListTree,
  CheckCircle2,
  Circle,
  Repeat,
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
      className={`p-3.5 rounded-lg border border-border bg-card shadow-xs cursor-grab active:cursor-grabbing space-y-2.5 transition-[border-color,background-color] select-none ${
        isDragging ? 'opacity-40 scale-95 border-foreground ring-2 ring-foreground/20' : 'hover:border-foreground/30'
      }`}
    >
      {/* Header Badges & Actions */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityBadge priority={task.priority} />

          <Tooltip content="Công việc có việc con cần thực hiện từng bước">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border cursor-help">
              <ListTree className="w-3 h-3 flex-shrink-0" />
              <span className="tabular-nums">{total} việc con</span>
            </span>
          </Tooltip>

          {task.isRecurring && (
            <Tooltip content={`Lặp lại: ${task.recurrenceRule}`}>
              <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium border border-border">
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
              className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded transition-colors cursor-pointer focus-ring"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </Tooltip>
          <Tooltip content="Xóa công việc">
            <button
              type="button"
              onClick={(e) => onDeleteTask(task.id, e)}
              aria-label={`Xóa công việc: ${task.title}`}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1 rounded transition-colors cursor-pointer focus-ring"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Task Title */}
      <div
        className={`font-medium text-xs sm:text-sm leading-snug ${
          isDone ? 'line-through text-muted-foreground' : 'text-foreground'
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
              className="p-2.5 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground select-text leading-relaxed whitespace-pre-wrap break-words mt-1"
            >
              <div className="flex items-center justify-between text-[9px] text-muted-foreground font-medium mb-1 pb-1 border-b border-border">
                <span>Mô tả chi tiết</span>
                <button
                  type="button"
                  onClick={(e) => toggleDescriptionExpand(task.id, e)}
                  className="text-foreground hover:underline cursor-pointer font-medium"
                >
                  Thu gọn ▲
                </button>
              </div>
              {task.description}
            </div>
          ) : (
            <p
              title="Bấm để xem toàn bộ mô tả"
              className="text-[11px] text-muted-foreground line-clamp-2 hover:text-foreground transition-colors"
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
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium border"
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

      {/* Multi-tier Progress Bar on Kanban Card */}
      <div
        className="p-2.5 rounded-lg bg-muted/30 border border-border space-y-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between text-[11px] gap-1 flex-wrap">
          <Tooltip content={`Tiến độ: ${progressConfig.stageLabel}. Tự động cập nhật tức thì.`}>
            <span className="font-medium text-foreground flex items-center gap-1 cursor-help">
              <span className="text-muted-foreground">Tiến độ:</span>
              <span className="tabular-nums font-semibold">
                {completed}/{total} ({percentage}%)
              </span>
            </span>
          </Tooltip>

          {percentage === 100 ? (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> 100%
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-muted text-muted-foreground border border-border">
              {progressConfig.stageLabel}
            </span>
          )}
        </div>

        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden border border-border/50">
          <div
            className="h-full rounded-full transition-[width] duration-200 ease-out bg-foreground"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Interactive Mini Checklist right on Kanban Card */}
        <div className="space-y-1 pt-1.5 border-t border-border">
          {subtasks.map((st, idx) => (
            <div
              key={st.id}
              onClick={(e) => onToggleSubtask(task.id, st.id, e)}
              className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted/60 transition-colors cursor-pointer group"
            >
              <Tooltip
                content={
                  st.isCompleted
                    ? `Đã xong: "${st.title}". Bấm để hoàn tác.`
                    : `Bấm để hoàn thành việc con "${st.title}".`
                }
              >
                <button
                  type="button"
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground focus-ring rounded"
                  aria-label={`Đổi việc con: ${st.title}`}
                >
                  {st.isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-foreground" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground" />
                  )}
                </button>
              </Tooltip>

              <span className="text-[10px] text-muted-foreground font-medium tabular-nums flex-shrink-0">
                {idx + 1}.
              </span>

              <span
                className={`text-[11px] truncate flex-1 ${
                  st.isCompleted
                    ? 'line-through text-muted-foreground'
                    : 'text-foreground font-normal group-hover:text-foreground'
                }`}
              >
                {st.title}
              </span>

              {st.dueDate && (() => {
                const dueInfo = getRemainingDaysInfo(st.dueDate, st.isCompleted ? 'DONE' : 'TODO');
                return (
                  <Tooltip content={`Hạn chót: ${dueInfo.formattedDue}`}>
                    <span
                      className={`text-[9px] px-1 py-0.5 rounded border font-medium flex-shrink-0 flex items-center gap-0.5 tabular-nums ${
                        st.isCompleted
                          ? 'bg-muted text-muted-foreground border-border'
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
