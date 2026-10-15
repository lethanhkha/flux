import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Repeat,
  Layers,
  List,
  X,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { toast } from 'sonner';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  isRecurring: boolean;
  recurrenceRule?: string;
}

export const TasksPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filter, setFilter] = useState<'ALL' | 'TODAY' | 'OVERDUE' | 'DONE'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 't1',
      title: 'Hoàn thành báo cáo tiến độ tuần dự án Flux',
      description: 'Cập nhật tài liệu roadmap và bàn giao Phase 3',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      dueDate: 'Hôm nay, 17:00',
      isRecurring: true,
      recurrenceRule: 'Hàng tuần',
    },
    {
      id: 't2',
      title: 'Đọc 20 trang sách "Tâm lý học về tiền"',
      description: 'Chương 4: Sự tự do tài chính',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: 'Hôm nay, 21:00',
      isRecurring: true,
      recurrenceRule: 'Hàng ngày',
    },
    {
      id: 't3',
      title: 'Thanh toán tiền điện & Internet',
      status: 'DONE',
      priority: 'HIGH',
      dueDate: 'Đã hoàn thành',
      isRecurring: false,
    },
    {
      id: 't4',
      title: 'Gặp gỡ cố vấn tài chính trao đổi danh mục đầu tư',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: 'Ngày mai, 09:30',
      isRecurring: false,
    },
    {
      id: 't5',
      title: 'Đối soát chi tiêu các thẻ ngân hàng',
      status: 'DONE',
      priority: 'LOW',
      dueDate: 'Đã hoàn thành',
      isRecurring: true,
      recurrenceRule: 'Hàng tháng',
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newTaskDue, setNewTaskDue] = useState('Hôm nay, 18:00');

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'DONE' ? 'TODO' : 'DONE';
          if (nextStatus === 'DONE') {
            toast.success(`Đã hoàn thành: "${t.title}"`);
          }
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      status: 'TODO',
      priority: newTaskPriority,
      dueDate: newTaskDue,
      isRecurring: false,
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setIsAddModalOpen(false);
    toast.success('Đã thêm công việc mới vào danh sách!');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'DONE') return t.status === 'DONE';
    if (filter === 'TODAY') return t.dueDate.includes('Hôm nay');
    if (filter === 'OVERDUE') return t.priority === 'URGENT' && t.status !== 'DONE';
    return true;
  });

  const priorityBadge = (p: TaskItem['priority']) => {
    switch (p) {
      case 'URGENT':
        return <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 font-bold">Khẩn cấp</span>;
      case 'HIGH':
        return <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-bold">Ưu tiên cao</span>;
      case 'MEDIUM':
        return <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 font-bold">Trung bình</span>;
      case 'LOW':
        return <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-500 font-bold">Thấp</span>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản Lý Công Việc & Năng Suất</h1>
            <p className="text-xs text-slate-500 mt-1">To-do list thông minh với bộ lọc deadline và chế độ xem linh hoạt</p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm font-bold' : 'text-slate-500'
                }`}
                title="Dạng danh sách"
              >
                <List className="w-4 h-4" />
                <span>Danh Sách</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm font-bold' : 'text-slate-500'
                }`}
                title="Bảng Kanban"
              >
                <Layers className="w-4 h-4" />
                <span>Kanban</span>
              </button>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Việc</span>
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {(['ALL', 'TODAY', 'OVERDUE', 'DONE'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filter === key
                  ? 'bg-brand text-white border-brand font-bold shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand/40'
              }`}
            >
              {key === 'ALL' && `Tất cả (${tasks.length})`}
              {key === 'TODAY' && 'Hôm nay'}
              {key === 'OVERDUE' && 'Gấp / Khẩn'}
              {key === 'DONE' && 'Đã hoàn thành'}
            </button>
          ))}
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTaskStatus(t.id)}
                className={`p-4 rounded-2xl border transition-all flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:border-brand/50 ${
                  t.status === 'DONE'
                    ? 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800/80 opacity-70'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover-lift'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={t.status === 'DONE'}
                    onChange={() => {}}
                    className="w-5 h-5 rounded-md border-slate-300 text-brand focus:ring-brand checkbox-pop cursor-pointer mt-0.5 sm:mt-0 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`font-semibold text-sm line-clamp-1 transition-all ${
                        t.status === 'DONE'
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {t.title}
                    </div>
                    {t.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{t.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 flex-shrink-0">
                  {priorityBadge(t.priority)}

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t.dueDate}</span>
                  </div>

                  {t.isRecurring && (
                    <div className="hidden md:flex items-center gap-1 text-[11px] text-brand bg-brand/10 px-2 py-0.5 rounded">
                      <Repeat className="w-3 h-3" />
                      <span>{t.recurrenceRule}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Kanban Board View */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((status) => {
              const columnTasks = tasks.filter((t) => t.status === status);
              return (
                <div key={status} className="bg-slate-100/70 dark:bg-slate-900/60 p-4 rounded-3xl space-y-3 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between px-2 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <span>
                      {status === 'TODO' && 'Cần làm'}
                      {status === 'IN_PROGRESS' && 'Đang thực hiện'}
                      {status === 'DONE' && 'Đã hoàn thành'}
                    </span>
                    <span className="h-5 w-5 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[10px]">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {columnTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => toggleTaskStatus(t.id)}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover-lift cursor-pointer space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          {priorityBadge(t.priority)}
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {t.dueDate}
                          </span>
                        </div>
                        <div className={`font-semibold text-xs ${t.status === 'DONE' ? 'line-through text-slate-400' : ''}`}>
                          {t.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Task Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm modal-backdrop-animate">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl modal-dialog-animate space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base">Thêm Công Việc Mới</h3>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Tiêu đề công việc</label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="VD: Kiểm tra và nộp báo cáo thuế..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Độ ưu tiên</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    >
                      <option value="URGENT">Khẩn cấp</option>
                      <option value="HIGH">Ưu tiên cao</option>
                      <option value="MEDIUM">Trung bình</option>
                      <option value="LOW">Thấp</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Hạn chót</label>
                    <input
                      type="text"
                      value={newTaskDue}
                      onChange={(e) => setNewTaskDue(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all cursor-pointer"
                >
                  Tạo Công Việc
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
