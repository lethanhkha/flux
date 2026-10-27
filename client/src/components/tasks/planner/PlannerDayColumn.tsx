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
      className={`flex flex-col min-w-[210px] w-full rounded-3xl border transition-all duration-200 select-none ${
        isDragOver
          ? 'bg-brand/5 border-2 border-dashed border-brand ring-4 ring-brand/10 shadow-md'
          : isToday
          ? 'bg-brand/[0.02] dark:bg-slate-900/90 border-brand/40 shadow-xs'
          : 'bg-slate-100/50 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800'
      }`}
    >
      {/* Column Header */}
      <div
        className={`p-3.5 border-b rounded-t-3xl transition-colors ${
          isToday
            ? 'bg-brand/10 dark:bg-brand/20 border-brand/30'
            : 'border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ${
                isToday
                  ? 'bg-brand text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {dayNumber}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-100 capitalize">
                  {dayName}
                </span>
                {isToday && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-brand text-white tracking-wide">
                    Hôm nay
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {formattedDate}
              </div>
            </div>
          </div>

          {/* Quick add button */}
          <Tooltip content={`Thêm việc vào ${dayName}`}>
            <button
              type="button"
              onClick={() => onQuickAdd(date)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Task progress stats */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
          <span>{tasks.length} công việc</span>
          {tasks.length > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>
                {completedCount}/{tasks.length} xong
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Task List / Drop Area */}
      <div className="flex-1 p-2.5 space-y-2.5 min-h-[380px] overflow-y-auto max-h-[calc(100vh-280px)]">
        {tasks.length === 0 ? (
          <div
            onClick={() => onQuickAdd(date)}
            className={`h-full min-h-[160px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-slate-200/70 dark:border-slate-800/70 hover:border-brand/40 text-slate-400 hover:text-brand'
            }`}
          >
            <Calendar className="w-5 h-5 mb-1.5 opacity-60" />
            <span className="text-[11px] font-semibold">
              {isDragOver ? 'Thả việc vào đây' : 'Chưa có việc'}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5">
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
