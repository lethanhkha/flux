import React, { useState, useMemo } from 'react';
import {
  Inbox,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { TaskItem } from '../CompositeTaskRow';
import { PlannerTaskCard } from './PlannerTaskCard';
import { Tooltip } from '../../common/Tooltip';

interface PlannerUnscheduledColumnProps {
  tasks: TaskItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isDragOver: boolean;
  draggingTaskId: string | null;
  onDragOver: (e: React.DragEvent, target: 'unscheduled') => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, target: 'unscheduled') => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
  onToggleStatus: (taskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onReschedule: (taskId: string, targetDateStr: string | null) => void;
  onQuickAdd: () => void;
  getTagColor: (tag: string) => string;
}

export const PlannerUnscheduledColumn: React.FC<PlannerUnscheduledColumnProps> = ({
  tasks,
  isCollapsed,
  onToggleCollapse,
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
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'has_due' | 'urgent'>('all');

  // Filter tasks in backlog
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      if (filterMode === 'has_due') {
        return Boolean(t.rawDueDate);
      }
      if (filterMode === 'urgent') {
        return t.priority === 'URGENT' || t.priority === 'HIGH';
      }
      return true;
    });
  }, [tasks, search, filterMode]);

  // When collapsed: render sleek vertical ribbon
  if (isCollapsed) {
    return (
      <div
        onDragOver={(e) => onDragOver(e, 'unscheduled')}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, 'unscheduled')}
        className={`w-12 flex-shrink-0 flex flex-col items-center justify-between py-4 rounded-3xl border transition-all duration-200 select-none cursor-pointer ${
          isDragOver
            ? 'bg-brand/10 border-2 border-dashed border-brand ring-4 ring-brand/10'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-brand/40'
        }`}
        onClick={onToggleCollapse}
      >
        <div className="flex flex-col items-center gap-2">
          <Tooltip content="Mở rộng Hộp việc chưa xếp">
            <button
              type="button"
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </Tooltip>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
        </div>

        <div className="[writing-mode:vertical-rl] rotate-180 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 py-4">
          <Inbox className="w-3.5 h-3.5 rotate-90" />
          <span>Hộp việc chưa xếp</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-brand font-bold rotate-90">
            {tasks.length}
          </span>
        </div>

        <div className="text-[9px] text-slate-400 font-medium px-1 text-center">
          {isDragOver ? 'Thả vào' : ''}
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => onDragOver(e, 'unscheduled')}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, 'unscheduled')}
      className={`w-72 sm:w-80 flex-shrink-0 flex flex-col rounded-3xl border transition-all duration-200 select-none ${
        isDragOver
          ? 'bg-brand/5 border-2 border-dashed border-brand ring-4 ring-brand/10 shadow-md'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                  Chưa xếp lịch
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                  {tasks.length}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Kéo việc sang các ngày để phân bổ
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip content="Thêm công việc mới">
              <button
                type="button"
                onClick={onQuickAdd}
                className="p-1.5 rounded-xl text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip content="Thu gọn cột chưa xếp">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Local Search inside Backlog */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm việc trong hộp..."
            className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2 py-0.5 rounded-lg font-medium transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tất cả ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('has_due')}
            className={`px-2 py-0.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
              filterMode === 'has_due'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-2.5 h-2.5" />
            <span>Có hạn</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('urgent')}
            className={`px-2 py-0.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
              filterMode === 'urgent'
                ? 'bg-rose-500 text-white font-bold'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertCircle className="w-2.5 h-2.5" />
            <span>Ưu tiên cao</span>
          </button>
        </div>
      </div>

      {/* Task List / Drop Area */}
      <div className="flex-1 p-2.5 space-y-2.5 min-h-[380px] overflow-y-auto max-h-[calc(100vh-280px)]">
        {filteredTasks.length === 0 ? (
          <div className="h-full min-h-[160px] rounded-2xl border-2 border-dashed border-slate-200/70 dark:border-slate-800/70 flex flex-col items-center justify-center p-4 text-center text-slate-400">
            <Inbox className="w-6 h-6 mb-1.5 opacity-50" />
            <span className="text-[11px] font-semibold">
              {isDragOver ? 'Thả để hủy xếp ngày' : 'Không có công việc'}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5">
              Tất cả công việc đã được phân bổ vào các ngày!
            </span>
          </div>
        ) : (
          filteredTasks.map((task) => (
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
