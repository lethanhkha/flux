import React from 'react';
import { Plus, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TaskItem } from '../CompositeTaskRow';
import { PlannerTaskCard } from './PlannerTaskCard';
import { Tooltip } from '../../common/Tooltip';

interface PlannerDayColumnProps {
  date: Date;
  dateKey: string;
  tasks: TaskItem[];
  isToday: boolean;
  isDragOver: boolean;
  draggingTaskId: string | null;
  onDragOver: (e: React.DragEvent, dateKey: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, dateKey: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
  onToggleStatus: (taskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onReschedule: (taskId: string, targetDateStr: string | null) => void;
  onQuickAdd: (date: Date) => void;
  getTagColor: (tag: string) => string;
}

export const PlannerDayColumn: React.FC<PlannerDayColumnProps> = ({
  date,
  dateKey,
  tasks,
  isToday,
  isDragOver,
  draggingTaskId,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  onToggleStatus,
  onEditTask,
  onDeleteTask,
  onReschedule,
  onQuickAdd,
  getTagColor,
}) => {
  // Format day name: e.g. "Thứ Hai", "Thứ Ba"
  const dayName = format(date, 'EEEE', { locale: vi });
  const formattedDate = format(date, 'dd/MM');
  const dayNumber = format(date, 'd');

  const completedCount = tasks.filter((t) => t.status === 'DONE').length;

  return (
    <div
      onDragOver={(e) => onDragOver(e, dateKey)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, dateKey)}
      className={`flex flex-col min-w-[210px] flex-1 w-full rounded-xl border transition-[background-color,border-color] duration-150 select-none ${
        isDragOver
          ? 'bg-muted/60 border-foreground ring-2 ring-foreground/20 shadow-xs'
          : isToday
          ? 'bg-card border-foreground/30 shadow-xs'
          : 'bg-card/50 border-border'
      }`}
    >
      {/* Column Header */}
      <div
        className={`p-3 border-b rounded-t-xl transition-colors ${
          isToday
            ? 'bg-muted/80 border-border'
            : 'border-border bg-card'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-md flex items-center justify-center font-medium text-xs tabular-nums ${
                isToday
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {dayNumber}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-xs text-foreground capitalize">
                  {dayName}
                </span>
                {isToday && (
                  <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-foreground text-background">
                    Hôm nay
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground font-normal tabular-nums">
                {formattedDate}
              </div>
            </div>
          </div>

          {/* Quick add button */}
          <Tooltip content={`Thêm việc vào ${dayName}`}>
            <button
              type="button"
              onClick={() => onQuickAdd(date)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Task progress stats */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground font-normal tabular-nums">
          <span>{tasks.length} công việc</span>
          {tasks.length > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>
                {completedCount}/{tasks.length} xong
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Task List / Drop Area */}
      <div className="flex-1 p-2 space-y-2 min-h-[380px] overflow-y-auto max-h-[calc(100vh-280px)]">
        {tasks.length === 0 ? (
          <div
            onClick={() => onQuickAdd(date)}
            className={`h-full min-h-[160px] rounded-lg border border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-foreground bg-muted text-foreground'
                : 'border-border hover:border-foreground/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="w-4 h-4 mb-1 opacity-60" />
            <span className="text-[11px] font-medium">
              {isDragOver ? 'Thả việc vào đây' : 'Chưa có việc'}
            </span>
            <span className="text-[9px] text-muted-foreground mt-0.5">
              Kéo việc vào hoặc bấm để tạo
            </span>
          </div>
        ) : (
          tasks.map((task) => (
            <PlannerTaskCard
              key={task.id}
              task={task}
              isDragging={draggingTaskId === task.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onToggleStatus={onToggleStatus}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onReschedule={onReschedule}
              getTagColor={getTagColor}
            />
          ))
        )}
      </div>
    </div>
  );
};
