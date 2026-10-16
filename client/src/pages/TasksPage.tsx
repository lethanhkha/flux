import React, { useState, useEffect } from 'react';
import { apiClient, getErrorMessage } from '../api/client';
import {
  CheckSquare,
  Plus,
  Clock,
  Repeat,
  Layers,
  List,
  X,
  Trash2,
  Tag,
  Settings,
  ChevronDown,
  ChevronUp,
  AlignLeft,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { toast } from 'sonner';
import { PaginationControl, PaginationMeta } from '../components/common/PaginationControl';
import { Modal } from '../components/common/Modal';
import { TaskTagModal, TaskTagItem } from '../components/tasks/TaskTagModal';
import { TagSelect } from '../components/notes/TagSelect';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  tags?: string[];
}

type TaskFilterKey = 'ALL' | 'TODAY' | 'OVERDUE' | 'URGENT' | 'DONE';

export const TasksPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filter, setFilter] = useState<TaskFilterKey>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [availableTags, setAvailableTags] = useState<TaskTagItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newTaskDue, setNewTaskDue] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [newTaskIsRecurring, setNewTaskIsRecurring] = useState(false);
  const [newTaskRecurrenceRule, setNewTaskRecurrenceRule] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag and Drop State for Kanban
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<'TODO' | 'IN_PROGRESS' | 'DONE' | null>(null);

  // Set of task IDs with expanded descriptions
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  const toggleDescriptionExpand = (taskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Mouse-wheel horizontal scroll ref for tags
  const tagBarRef = useHorizontalScroll<HTMLDivElement>();

  // Fetch all tags globally for user
  const fetchTags = async () => {
    try {
      const res = await apiClient.get('/tasks/tags');
      if (Array.isArray(res.data?.data)) {
        setAvailableTags(res.data.data);
      }
    } catch {
      // Gracefully maintain current tags
    }
  };

  const fetchTasks = async (page = 1) => {
    try {
      setIsLoading(true);
      const limit = viewMode === 'kanban' ? 60 : 20;
      const res = await apiClient.get('/tasks', {
        params: {
          page,
          limit,
          filter: filter.toLowerCase(),
          tag: selectedTag || undefined,
        },
      });

      const rawData = res.data?.data;
      const taskList = Array.isArray(rawData) ? rawData : (rawData?.items || []);

      setTasks(
        taskList.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate
            ? new Date(t.dueDate).toLocaleDateString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Không có hạn',
          isRecurring: t.isRecurring,
          recurrenceRule:
            t.recurrenceRule === 'DAILY'
              ? 'Hàng ngày'
              : t.recurrenceRule === 'WEEKLY'
              ? 'Hàng tuần'
              : t.recurrenceRule === 'MONTHLY'
              ? 'Hàng tháng'
              : undefined,
          tags: Array.isArray(t.tags) ? t.tags : [],
        }))
      );

      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      } else if (rawData?.pagination) {
        setPagination(rawData.pagination);
      }
    } catch {
      // Fallback to empty list gracefully
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchTasks(1);
  }, [filter, selectedTag, viewMode]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchTasks(pagination.page);
      fetchTags();
    };
    window.addEventListener('flux:refresh-data', handleRefresh);
    return () => window.removeEventListener('flux:refresh-data', handleRefresh);
  }, [pagination.page, filter, selectedTag, viewMode]);

  const toggleTaskStatus = async (id: string) => {
    // Optimistic UI update
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

    try {
      await apiClient.patch(`/tasks/${id}/toggle`);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái.'));
      fetchTasks(pagination.page);
    }
  };

  const handleDeleteTask = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const taskToDelete = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success('Đã xóa công việc khỏi danh sách.');

    try {
      await apiClient.delete(`/tasks/${id}`);
      fetchTags();
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch {
      if (taskToDelete) setTasks((prev) => [taskToDelete, ...prev]);
      toast.error('Không thể xóa công việc trên máy chủ.');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsSubmitting(true);
    const tempId = `task-${Date.now()}`;
    const newTask: TaskItem = {
      id: tempId,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      status: 'TODO',
      priority: newTaskPriority,
      dueDate: newTaskDue
        ? new Date(newTaskDue).toLocaleDateString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Không có hạn',
      isRecurring: newTaskIsRecurring,
      recurrenceRule: newTaskIsRecurring
        ? newTaskRecurrenceRule === 'DAILY'
          ? 'Hàng ngày'
          : newTaskRecurrenceRule === 'WEEKLY'
          ? 'Hàng tuần'
          : 'Hàng tháng'
        : undefined,
      tags: [...newTaskTags],
    };

    setTasks([newTask, ...tasks]);
    setIsAddModalOpen(false);
    toast.success('Đã thêm công việc mới vào danh sách!');

    try {
      const res = await apiClient.post('/tasks', {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        priority: newTaskPriority,
        dueDate: newTaskDue ? new Date(newTaskDue).toISOString() : undefined,
        isRecurring: newTaskIsRecurring,
        recurrenceRule: newTaskIsRecurring ? newTaskRecurrenceRule : undefined,
        status: 'TODO',
        tags: newTaskTags,
      });
      if (res.data.data?.id) {
        const created = res.data.data;
        setTasks((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, id: created.id } : t))
        );
      }
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskIsRecurring(false);
      setNewTaskTags([]);
      fetchTags();
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể tạo công việc trên máy chủ.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tag Management Actions
  const handleRenameTag = async (oldTag: string, newTag: string) => {
    try {
      await apiClient.post('/tasks/tags/rename', { oldTag, newTag });
      toast.success(`Đã đổi tên thẻ #${oldTag} thành #${newTag}!`);
      if (selectedTag === oldTag) {
        setSelectedTag(newTag);
      }
      await Promise.all([fetchTags(), fetchTasks(pagination.page)]);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể đổi tên thẻ.'));
      throw err;
    }
  };

  const handleDeleteTag = async (tag: string) => {
    try {
      await apiClient.post('/tasks/tags/delete', { tag });
      toast.success(`Đã xóa thẻ #${tag} khỏi tất cả công việc!`);
      if (selectedTag === tag) {
        setSelectedTag(null);
      }
      await Promise.all([fetchTags(), fetchTasks(1)]);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể xóa thẻ.'));
      throw err;
    }
  };

  const handleUpdateTagColor = async (tag: string, color: string) => {
    try {
      await apiClient.patch('/tasks/tags/color', { tag, color });
      toast.success(`Đã cập nhật màu cho thẻ #${tag}!`);
      await fetchTags();
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật màu thẻ.'));
      throw err;
    }
  };

  const tagColorMap = React.useMemo(() => {
    const map = new Map<string, string>();
    availableTags.forEach((t) => {
      if (t.color) map.set(t.name.toLowerCase(), t.color);
    });
    return map;
  }, [availableTags]);

  const getTagColor = (name: string) => {
    return tagColorMap.get(name.toLowerCase()) || '#6366F1';
  };

  // HTML5 Drag and Drop Handlers for Kanban
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(id);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, column: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== column) {
      setDragOverColumn(column);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDraggingTaskId(null);
    setDragOverColumn(null);

    if (!taskId) return;
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.status === targetStatus) return;

    const prevStatus = targetTask.status;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: targetStatus,
              completedAt: targetStatus === 'DONE' ? new Date().toISOString() : undefined,
            }
          : t
      )
    );

    const statusLabels = {
      TODO: 'Cần làm',
      IN_PROGRESS: 'Đang thực hiện',
      DONE: 'Đã hoàn thành',
    };

    toast.success(`Đã chuyển công việc sang "${statusLabels[targetStatus]}"`);

    try {
      await apiClient.patch(`/tasks/${taskId}`, {
        status: targetStatus,
        completedAt: targetStatus === 'DONE' ? new Date().toISOString() : null,
      });
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      // Revert if API fails
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t))
      );
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái công việc.'));
    }
  };

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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold mb-2">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tiêu Điểm & Mục Tiêu Hành Động</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Làm Chủ Tiến Độ & Năng Suất
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              To-do list thông minh với gắn thẻ phân loại, chu kỳ lặp lại và tối ưu hóa hiệu suất cá nhân
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                  viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm font-bold' : 'text-slate-500'
                }`}
                title="Dạng danh sách"
              >
                <List className="w-4 h-4" />
                <span>Danh Sách</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                  viewMode === 'kanban' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm font-bold' : 'text-slate-500'
                }`}
                title="Bảng Kanban (Kéo thả)"
              >
                <Layers className="w-4 h-4" />
                <span>Kanban</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Việc</span>
            </button>
          </div>
        </div>

        {/* Filters & Tags Dual Stacked Bars */}
        <div className="space-y-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-xs">
          {/* Bar 1: Status & Priority Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar-x pb-1 pt-0.5 text-xs scroll-smooth">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 pl-1 flex-shrink-0 mr-1">
              Trạng thái:
            </span>
            {(['ALL', 'TODAY', 'OVERDUE', 'URGENT', 'DONE'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
                  filter === key
                    ? 'bg-brand text-white border-brand font-bold shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand/40'
                }`}
              >
                {key === 'ALL' && `Tất cả (${pagination.total})`}
                {key === 'TODAY' && 'Hôm nay'}
                {key === 'OVERDUE' && 'Quá hạn'}
                {key === 'URGENT' && 'Khẩn cấp'}
                {key === 'DONE' && 'Đã hoàn thành'}
              </button>
            ))}
          </div>

          {/* Bar 2: Quick Tags Filter Bar with smooth mouse-wheel horizontal scroll */}
          <div
            ref={tagBarRef}
            className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar-x pb-1 pt-0.5 text-xs scroll-smooth"
          >
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 pl-1 flex-shrink-0 mr-1">
              <Tag className="w-3.5 h-3.5 text-brand" /> Thẻ:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex-shrink-0 border ${
                selectedTag === null
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Tất cả thẻ
            </button>

            {availableTags.map((item) => {
              const isActive = selectedTag === item.name;
              const color = item.color || '#6366F1';
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setSelectedTag(isActive ? null : item.name)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 border ${
                    isActive
                      ? 'text-white font-bold shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:scale-[1.02]'
                  }`}
                  style={{
                    backgroundColor: isActive ? color : `${color}15`,
                    borderColor: isActive ? color : `${color}35`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isActive ? '#ffffff' : color }}
                  />
                  <span>#{item.name}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.2 rounded-full font-medium"
                    style={{
                      backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                      color: isActive ? '#ffffff' : 'inherit',
                    }}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsTagModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl text-xs border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-brand hover:border-brand transition-all flex items-center gap-1 cursor-pointer flex-shrink-0 ml-auto"
              title="Quản lý các thẻ công việc"
            >
              <Settings className="w-3 h-3" />
              <span>Quản Lý Thẻ</span>
            </button>
          </div>

          {/* Active compound filter summary banner */}
          {(filter !== 'ALL' || selectedTag !== null) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Đang lọc kết hợp:</span>
              {filter !== 'ALL' && (
                <span className="px-2.5 py-0.5 rounded-lg bg-brand/10 text-brand font-bold flex items-center gap-1">
                  Trạng thái:{' '}
                  {filter === 'TODAY'
                    ? 'Hôm nay'
                    : filter === 'OVERDUE'
                    ? 'Quá hạn'
                    : filter === 'URGENT'
                    ? 'Khẩn cấp'
                    : 'Đã hoàn thành'}
                </span>
              )}
              {selectedTag && (
                <span
                  className="px-2.5 py-0.5 rounded-lg font-bold border flex items-center gap-1"
                  style={{
                    backgroundColor: `${getTagColor(selectedTag)}18`,
                    borderColor: `${getTagColor(selectedTag)}35`,
                    color: getTagColor(selectedTag),
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getTagColor(selectedTag) }}
                  />
                  #{selectedTag}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setFilter('ALL');
                  setSelectedTag(null);
                }}
                className="text-slate-400 hover:text-rose-500 text-[11px] underline ml-auto cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          isLoading ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 animate-pulse"
                >
                  <div className="flex items-center gap-3.5 flex-1">
                    <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-4 w-20 bg-slate-100 dark:bg-slate-850 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {filter === 'ALL' && !selectedTag
                  ? 'Chưa có công việc nào trong danh sách'
                  : 'Không tìm thấy công việc nào khớp bộ lọc'}
              </h3>
              <p className="text-xs text-slate-400">
                {filter === 'ALL' && !selectedTag
                  ? 'Tạo ngay công việc đầu tiên để lập kế hoạch và theo dõi năng suất cá nhân!'
                  : 'Thử chuyển sang bộ lọc khác hoặc bỏ chọn thẻ để hiển thị thêm kết quả.'}
              </p>
              {tasks.length === 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo Công Việc Đầu Tiên</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => toggleTaskStatus(t.id)}
                  className={`p-4 rounded-2xl border transition-all flex ${
                    expandedTaskIds.has(t.id) ? 'items-start' : 'items-start sm:items-center'
                  } justify-between gap-4 cursor-pointer hover:border-brand/50 ${
                    t.status === 'DONE'
                      ? 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800/80 opacity-70'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover-lift'
                  }`}
                >
                  <div className={`flex ${expandedTaskIds.has(t.id) ? 'items-start' : 'items-start sm:items-center'} gap-3.5 flex-1 min-w-0`}>
                    <input
                      type="checkbox"
                      checked={t.status === 'DONE'}
                      onChange={() => {}}
                      className={`${expandedTaskIds.has(t.id) ? 'mt-1' : 'mt-0.5 sm:mt-0'} w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer flex-shrink-0`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold text-xs leading-snug truncate ${
                            t.status === 'DONE' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {t.title}
                        </span>
                        {t.isRecurring && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 flex-shrink-0 font-medium">
                            <Repeat className="w-2.5 h-2.5" /> {t.recurrenceRule}
                          </span>
                        )}
                      </div>

                      {t.description && (
                        <div className="mt-1">
                          {expandedTaskIds.has(t.id) ? (
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
                                  onClick={(e) => toggleDescriptionExpand(t.id, e)}
                                  className="inline-flex items-center gap-0.5 text-brand hover:underline cursor-pointer font-medium"
                                >
                                  Thu gọn <ChevronUp className="w-3 h-3" />
                                </button>
                              </div>
                              {t.description}
                            </div>
                          ) : (
                            <div className="flex items-start gap-1.5">
                              <p
                                onClick={(e) => toggleDescriptionExpand(t.id, e)}
                                title={t.description}
                                className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors flex-1"
                              >
                                {t.description}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => toggleDescriptionExpand(t.id, e)}
                                title="Bấm để xem toàn bộ mô tả"
                                className="inline-flex items-center gap-0.5 text-[10px] font-medium text-brand hover:underline cursor-pointer flex-shrink-0"
                              >
                                Xem thêm <ChevronDown className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {t.tags && t.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {t.tags.map((tag) => {
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

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {priorityBadge(t.priority)}

                    {t.dueDate && (
                      <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.dueDate}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDeleteTask(t.id, e)}
                      aria-label={`Xóa công việc: ${t.title}`}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors focus-ring cursor-pointer"
                      title="Xóa công việc"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Kanban Board View with HTML5 Drag & Drop */}
        {viewMode === 'kanban' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 flex items-center justify-between px-1">
              <span>💡 Mẹo: Cầm chuột kéo thả thẻ công việc qua lại giữa các cột để đổi trạng thái tức thì.</span>
              <span className="font-semibold text-slate-500">Đang hiển thị {tasks.length} công việc</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((status) => {
                const columnTasks = tasks.filter((t) => t.status === status);
                const isDragOver = dragOverColumn === status;

                return (
                  <div
                    key={status}
                    onDragOver={(e) => handleDragOver(e, status)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, status)}
                    className={`p-4 rounded-3xl space-y-3 border transition-all min-h-[360px] flex flex-col ${
                      isDragOver
                        ? 'bg-brand/5 border-2 border-dashed border-brand ring-4 ring-brand/10'
                        : 'bg-slate-100/70 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between px-2 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 pb-1 border-b border-slate-200/50 dark:border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            status === 'TODO'
                              ? 'bg-amber-400'
                              : status === 'IN_PROGRESS'
                              ? 'bg-brand'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span>
                          {status === 'TODO' && 'Cần làm'}
                          {status === 'IN_PROGRESS' && 'Đang thực hiện'}
                          {status === 'DONE' && 'Đã hoàn thành'}
                        </span>
                      </div>
                      <span className="h-5 w-5 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300 shadow-xs">
                        {isLoading ? '...' : columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1">
                      {isLoading ? (
                        [1, 2].map((k) => (
                          <div
                            key={k}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 animate-pulse"
                          >
                            <div className="flex items-center justify-between">
                              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
                              <div className="h-3 w-16 bg-slate-100 dark:bg-slate-850 rounded" />
                            </div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                          </div>
                        ))
                      ) : columnTasks.length === 0 ? (
                        <div className="h-32 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-1 text-slate-400">
                          <CheckSquare className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {isDragOver ? 'Thả vào đây để đổi trạng thái' : 'Cột trống'}
                          </div>
                        </div>
                      ) : (
                        columnTasks.map((t) => (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, t.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => toggleTaskStatus(t.id)}
                            className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover-lift cursor-grab active:cursor-grabbing space-y-2.5 transition-all select-none ${
                              draggingTaskId === t.id
                                ? 'opacity-40 scale-95 border-brand ring-2 ring-brand/30'
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              {priorityBadge(t.priority)}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {t.dueDate}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteTask(t.id, e)}
                                  aria-label={`Xóa công việc: ${t.title}`}
                                  className="text-slate-300 hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer focus-ring"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div
                              className={`font-semibold text-xs leading-snug ${
                                t.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              {t.title}
                            </div>
                            {t.description && (
                              <div
                                onClick={(e) => toggleDescriptionExpand(t.id, e)}
                                className="cursor-pointer"
                              >
                                {expandedTaskIds.has(t.id) ? (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 select-text leading-relaxed whitespace-pre-wrap break-words mt-1 shadow-xs"
                                  >
                                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold mb-1 pb-1 border-b border-slate-200/50 dark:border-slate-800">
                                      <span>Mô tả chi tiết</span>
                                      <button
                                        type="button"
                                        onClick={(e) => toggleDescriptionExpand(t.id, e)}
                                        className="text-brand hover:underline cursor-pointer font-medium"
                                      >
                                        Thu gọn ▲
                                      </button>
                                    </div>
                                    {t.description}
                                  </div>
                                ) : (
                                  <p
                                    title="Bấm để xem toàn bộ mô tả"
                                    className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                  >
                                    {t.description}
                                  </p>
                                )}
                              </div>
                            )}
                            {t.tags && t.tags.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 pt-1">
                                {t.tags.map((tag) => {
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
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tasks Pagination Control */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <PaginationControl
            pagination={pagination}
            onPageChange={(p) => fetchTasks(p)}
            isLoading={isLoading}
          />
        </div>

        {/* Add Task Modal (Now using fixed Portal Modal) */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          disableClose={isSubmitting}
          ariaLabelledBy="add-task-modal-title"
          maxWidth="md"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h3 id="add-task-modal-title" className="font-bold text-base">Thêm Công Việc Mới</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              aria-label="Đóng thêm công việc"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Mô tả chi tiết (Tùy chọn)</label>
              <textarea
                rows={2}
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Nhập ghi chú hoặc yêu cầu công việc..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Độ ưu tiên</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
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
                  type="datetime-local"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                />
              </div>
            </div>

            {/* Recurring toggle */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={newTaskIsRecurring}
                  onChange={(e) => setNewTaskIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer"
                />
                <span>Lặp lại định kỳ (Recurring Engine)</span>
              </label>
              {newTaskIsRecurring && (
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((rule) => (
                    <button
                      key={rule}
                      type="button"
                      onClick={() => setNewTaskRecurrenceRule(rule)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        newTaskRecurrenceRule === rule
                          ? 'bg-brand text-white border-brand'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {rule === 'DAILY' && 'Hàng ngày'}
                      {rule === 'WEEKLY' && 'Hàng tuần'}
                      {rule === 'MONTHLY' && 'Hàng tháng'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tags input using TagSelect */}
            <div>
              <label className="font-semibold block mb-1">Gắn thẻ phân loại (Tags)</label>
              <TagSelect
                availableTags={availableTags}
                selectedTags={newTaskTags}
                onChange={setNewTaskTags}
                placeholder="Chọn hoặc gõ tên thẻ mới..."
              />

              {/* Suggested tags */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-slate-400">
                <span className="font-medium">Gợi ý nhanh:</span>
                {['Dự án', 'Công việc', 'Học tập', 'Tài chính', 'Gia đình', 'Cá nhân']
                  .filter((s) => !newTaskTags.includes(s.toLowerCase()))
                  .map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        const clean = suggestion.toLowerCase();
                        if (!newTaskTags.includes(clean)) {
                          setNewTaskTags([...newTaskTags, clean]);
                        }
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 hover:bg-brand/10 hover:text-brand text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      +{suggestion}
                    </button>
                  ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo Công Việc'}
            </button>
          </form>
        </Modal>

        {/* Task Tag Manager Modal */}
        <TaskTagModal
          isOpen={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          tags={availableTags}
          onRenameTag={handleRenameTag}
          onDeleteTag={handleDeleteTag}
          onChangeColor={handleUpdateTagColor}
        />
      </div>
    </AppLayout>
  );
};
