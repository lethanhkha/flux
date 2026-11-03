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
        className={`w-12 flex-shrink-0 flex flex-col items-center justify-between py-4 rounded-xl border transition-[background-color,border-color] duration-150 select-none cursor-pointer ${
          isDragOver
            ? 'bg-muted/80 border-foreground ring-2 ring-foreground/20'
            : 'bg-card border-border shadow-xs hover:border-foreground/30'
        }`}
        onClick={onToggleCollapse}
      >
        <div className="flex flex-col items-center gap-2">
          <Tooltip content="Mở rộng Hộp việc chưa xếp">
            <button
              type="button"
              className="p-1 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </Tooltip>
          <span className="w-2 h-2 rounded-full bg-amber-500" />
        </div>

        <div className="[writing-mode:vertical-rl] rotate-180 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2 py-4">
          <Inbox className="w-3.5 h-3.5 rotate-90" />
          <span>Hộp việc chưa xếp</span>
          <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-foreground font-medium rotate-90 tabular-nums">
            {tasks.length}
          </span>
        </div>

        <div className="text-[9px] text-muted-foreground font-normal px-1 text-center">
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
      className={`w-72 sm:w-80 flex-shrink-0 flex flex-col rounded-xl border transition-[background-color,border-color] duration-150 select-none ${
        isDragOver
          ? 'bg-muted/60 border-foreground ring-2 ring-foreground/20 shadow-xs'
          : 'bg-card border-border shadow-xs'
      }`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-medium">
              <Inbox className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-xs text-foreground">
                  Chưa xếp lịch
                </span>
                <span className="px-1.5 py-0.2 rounded bg-muted text-[10px] text-muted-foreground font-medium tabular-nums">
                  {tasks.length}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground font-normal">
                Kéo việc sang các ngày để phân bổ
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip content="Thêm công việc mới">
              <button
                type="button"
                onClick={onQuickAdd}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip content="Thu gọn cột chưa xếp">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Local Search inside Backlog */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm việc trong hộp…"
            className="w-full pl-8 pr-3 py-1 text-[11px] rounded-md border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer tabular-nums ${
              filterMode === 'all'
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Tất cả ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('has_due')}
            className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              filterMode === 'has_due'
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Clock className="w-2.5 h-2.5" />
            <span>Có hạn</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('urgent')}
            className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              filterMode === 'urgent'
                ? 'bg-destructive text-destructive-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <AlertCircle className="w-2.5 h-2.5" />
            <span>Ưu tiên cao</span>
          </button>
        </div>
      </div>

      {/* Task List / Drop Area */}
      <div className="flex-1 p-2 space-y-2 min-h-[380px] overflow-y-auto max-h-[calc(100vh-280px)]">
        {filteredTasks.length === 0 ? (
          <div className="h-full min-h-[160px] rounded-lg border border-dashed border-border flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
            <Inbox className="w-5 h-5 mb-1.5 opacity-50" />
            <span className="text-[11px] font-medium">
              {isDragOver ? 'Thả để hủy xếp ngày' : 'Không có công việc'}
            </span>
            <span className="text-[9px] text-muted-foreground mt-0.5">
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
