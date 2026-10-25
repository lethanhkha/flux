import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiClient, getErrorMessage } from '../api/client';
import {
  CheckSquare,
  Plus,
  Layers,
  List,
  X,
  Tag,
  Settings,
  ListTodo,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { PaginationControl, PaginationMeta } from '../components/common/PaginationControl';
import { Modal } from '../components/common/Modal';
import { TaskTagModal, TaskTagItem } from '../components/tasks/TaskTagModal';
import { TagSelect } from '../components/notes/TagSelect';
import { EditTaskModal } from '../components/tasks/EditTaskModal';
import { EmptyTasks, EmptySearch } from '../components/illustrations';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';
import { Tooltip, InfoTooltip } from '../components/common/Tooltip';
import { CustomSelect } from '../components/common/CustomSelect';
import { SearchInput } from '../components/common/SearchInput';
import { useDebounce } from '../hooks/useDebounce';
import { PRIORITY_TOOLTIPS } from '../lib/taskUtils';
import { SubtaskItem } from '../components/tasks/SubtaskList';
import { CompositeTaskRow } from '../components/tasks/CompositeTaskRow';
import { KanbanCompositeCard } from '../components/tasks/KanbanCompositeCard';
import { SimpleTaskRow } from '../components/tasks/SimpleTaskRow';
import { KanbanTaskCard } from '../components/tasks/KanbanTaskCard';
import { TaskDeleteUndoToast } from '../components/tasks/TaskDeleteUndoToast';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  rawDueDate?: string | null;
  isRecurring: boolean;
  recurrenceRule?: string;
  rawRecurrenceRule?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null;
  tags?: string[];
  subtasks?: SubtaskItem[];
}

interface PendingDeleteTask {
  timer: NodeJS.Timeout;
  task: TaskItem;
  index: number;
  toastId: string | number;
}

type TaskFilterKey = 'ALL' | 'TODAY' | 'OVERDUE' | 'URGENT' | 'DONE';

export const TasksPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filter, setFilter] = useState<TaskFilterKey>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [hideCompleted, setHideCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('flux_tasks_hide_completed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleHideCompleted = useCallback(() => {
    setHideCompleted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('flux_tasks_hide_completed', String(next));
      } catch {
        // Safe ignore
      }
      return next;
    });
  }, []);

  // When user explicitly selects 'DONE' filter pill, show completed tasks
  const effectiveHideCompleted = filter === 'DONE' ? false : hideCompleted;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

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

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [excludedTags, setExcludedTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('flux_tasks_excluded_tags');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleExcludeTag = useCallback((tagName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const cleanName = tagName.toLowerCase().trim();
    setExcludedTags((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === cleanName);
      const next = exists
        ? prev.filter((t) => t.toLowerCase() !== cleanName)
        : [...prev, tagName];
      try {
        localStorage.setItem('flux_tasks_excluded_tags', JSON.stringify(next));
      } catch {
        // Safe ignore
      }
      return next;
    });

    // If tag was in selectedTags, remove it from selectedTags so it's not both included and excluded
    setSelectedTags((prev) => prev.filter((t) => t.toLowerCase() !== cleanName));
  }, []);

  const handleToggleTag = useCallback((tagName: string) => {
    const cleanName = tagName.toLowerCase().trim();

    // If it was excluded, un-exclude it automatically when explicitly selected
    setExcludedTags((prev) => {
      if (prev.some((t) => t.toLowerCase() === cleanName)) {
        const next = prev.filter((t) => t.toLowerCase() !== cleanName);
        try {
          localStorage.setItem('flux_tasks_excluded_tags', JSON.stringify(next));
        } catch {
          // Safe ignore
        }
        return next;
      }
      return prev;
    });

    setSelectedTags((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === cleanName);
      if (exists) {
        return prev.filter((t) => t.toLowerCase() !== cleanName);
      }
      return [...prev, tagName];
    });
  }, []);
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newTaskDue, setNewTaskDue] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [newTaskIsRecurring, setNewTaskIsRecurring] = useState(false);
  const [newTaskRecurrenceRule, setNewTaskRecurrenceRule] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [newTaskSubtasks, setNewTaskSubtasks] = useState<string[]>([]);
  const [draftSubtaskInput, setDraftSubtaskInput] = useState('');
  const draftSubtaskInputRef = useRef<HTMLInputElement>(null);
  const pendingDeletionsRef = useRef<Map<string, PendingDeleteTask>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag and Drop State for Kanban
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<'TODO' | 'IN_PROGRESS' | 'DONE' | null>(null);

  // Set of task IDs with expanded descriptions
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  const toggleDescriptionExpand = useCallback((taskId: string, e?: React.MouseEvent) => {
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
  }, []);

  const handleToggleSubtaskFromList = useCallback(async (taskId: string, subtaskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let prevTasksSnapshot: TaskItem[] = [];

    setTasks((prev) => {
      prevTasksSnapshot = prev;
      const targetTask = prev.find((t) => t.id === taskId);
      if (!targetTask) return prev;

      const prevSubtasks = targetTask.subtasks || [];
      const updatedSubtasks = prevSubtasks.map((st) =>
        st.id === subtaskId
          ? {
              ...st,
              isCompleted: !st.isCompleted,
              completedAt: !st.isCompleted ? new Date().toISOString() : null,
            }
          : st
      );

      const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.isCompleted);
      let newStatus = targetTask.status;

      if (allDone && targetTask.status !== 'DONE') {
        newStatus = 'DONE';
        toast.success(`🎉 Tuyệt vời! Bạn đã hoàn thành 100% việc con của "${targetTask.title}"!`);
      } else if (!allDone && targetTask.status === 'DONE') {
        newStatus = 'IN_PROGRESS';
        toast.info(`Công việc "${targetTask.title}" đã chuyển về "Đang thực hiện" vì còn việc con chưa xong.`);
      }

      return prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: updatedSubtasks,
              status: newStatus,
              completedAt: newStatus === 'DONE' ? new Date().toISOString() : null,
            }
          : t
      );
    });

    try {
      await apiClient.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
      window.dispatchEvent(
        new CustomEvent('flux:refresh-data', {
          detail: { source: 'tasks-subtask-toggle', taskId },
        })
      );
    } catch (err: any) {
      if (prevTasksSnapshot.length > 0) setTasks(prevTasksSnapshot);
      toast.error(getErrorMessage(err, 'Không thể cập nhật việc con.'));
    }
  }, []);

  const handleAddDraftSubtask = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = draftSubtaskInput.trim();
    if (!clean) return;
    setNewTaskSubtasks((prev) => [...prev, clean]);
    setDraftSubtaskInput('');
    draftSubtaskInputRef.current?.focus();
    setTimeout(() => {
      draftSubtaskInputRef.current?.focus();
    }, 0);
  }, [draftSubtaskInput]);

  const handleRemoveDraftSubtask = useCallback((index: number) => {
    setNewTaskSubtasks((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  // Mouse-wheel horizontal scroll ref for tags
  const tagBarRef = useHorizontalScroll<HTMLDivElement>();

  // Fetch all tags globally for user
  const fetchTags = useCallback(async () => {
    try {
      const res = await apiClient.get('/tasks/tags');
      if (Array.isArray(res.data?.data)) {
        setAvailableTags(res.data.data);
      }
    } catch {
      // Gracefully maintain current tags
    }
  }, []);

  const fetchTasks = useCallback(async (page = 1, isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      const limit = viewMode === 'kanban' ? 60 : 20;
      const res = await apiClient.get('/tasks', {
        params: {
          page,
          limit,
          filter: filter.toLowerCase(),
          tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
          excludeTags: excludedTags.length > 0 ? excludedTags.join(',') : undefined,
          search: debouncedSearch.trim() || undefined,
          hideCompleted: effectiveHideCompleted ? true : undefined,
        },
      });

      const rawData = res.data?.data;
      const rawTaskList = Array.isArray(rawData) ? rawData : (rawData?.items || []);
      const pendingIds = new Set(pendingDeletionsRef.current.keys());
      const taskList = rawTaskList.filter((t: any) => !pendingIds.has(t.id));

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
          rawDueDate: t.dueDate || null,
          isRecurring: t.isRecurring,
          recurrenceRule:
            t.recurrenceRule === 'DAILY'
              ? 'Hàng ngày'
              : t.recurrenceRule === 'WEEKLY'
              ? 'Hàng tuần'
              : t.recurrenceRule === 'MONTHLY'
              ? 'Hàng tháng'
              : undefined,
          rawRecurrenceRule: t.recurrenceRule || null,
          tags: Array.isArray(t.tags) ? t.tags : [],
          subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
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
      if (!isSilent) setIsLoading(false);
    }
  }, [viewMode, filter, selectedTags, excludedTags, debouncedSearch, effectiveHideCompleted]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchTasks(1);
  }, [fetchTasks]);

  useEffect(() => {
    const handleRefresh = (e: Event) => {
      const customEvent = e as CustomEvent;
      // Skip if event originated from TasksPage's own actions to prevent full-page flicker
      if (customEvent.detail?.source?.startsWith('tasks-')) {
        return;
      }
      fetchTasks(pagination.page, true);
      fetchTags();
    };
    window.addEventListener('flux:refresh-data', handleRefresh);
    return () => window.removeEventListener('flux:refresh-data', handleRefresh);
  }, [fetchTasks, fetchTags, pagination.page]);

  // Flush and commit any pending deletions when unmounting the page
  useEffect(() => {
    return () => {
      pendingDeletionsRef.current.forEach((pending, taskId) => {
        clearTimeout(pending.timer);
        apiClient.delete(`/tasks/${taskId}`).catch(() => {});
      });
      pendingDeletionsRef.current.clear();
    };
  }, []);

  const toggleTaskStatus = useCallback(async (id: string) => {
    let prevTasksSnapshot: TaskItem[] = [];

    // Optimistic UI update
    setTasks((prev) => {
      prevTasksSnapshot = prev;
      return prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'DONE' ? 'TODO' : 'DONE';
          if (nextStatus === 'DONE') {
            toast.success(`Đã hoàn thành: "${t.title}"`);
          } else {
            toast.info(`Đã mở lại công việc: "${t.title}"`);
          }
          // If completing parent task, mark all existing subtasks as completed.
          // Conversely, if unticking parent task, reset all subtasks to incomplete!
          const updatedSubtasks = t.subtasks
            ? t.subtasks.map((st) => ({
                ...st,
                isCompleted: nextStatus === 'DONE',
                completedAt: nextStatus === 'DONE' ? new Date().toISOString() : null,
              }))
            : t.subtasks;

          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'DONE' ? new Date().toISOString() : null,
            subtasks: updatedSubtasks,
          };
        }
        return t;
      });
    });

    try {
      await apiClient.patch(`/tasks/${id}/toggle`);
      window.dispatchEvent(
        new CustomEvent('flux:refresh-data', {
          detail: { source: 'tasks-status-toggle', taskId: id },
        })
      );
    } catch (err: any) {
      if (prevTasksSnapshot.length > 0) setTasks(prevTasksSnapshot);
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái.'));
    }
  }, []);

  // Handle commit deletion to server (runs after 6s countdown expires or user closes toast)
  const handleCommitDelete = useCallback(
    async (taskId: string, toastId?: string | number) => {
      const pending = pendingDeletionsRef.current.get(taskId);
      if (!pending) return;

      clearTimeout(pending.timer);
      pendingDeletionsRef.current.delete(taskId);

      if (toastId) {
        toast.dismiss(toastId);
      }

      try {
        await apiClient.delete(`/tasks/${taskId}`);
        fetchTags();
        window.dispatchEvent(
          new CustomEvent('flux:refresh-data', {
            detail: { source: 'tasks-delete', taskId },
          })
        );
      } catch (err: any) {
        // Revert if server request fails
        setTasks((prev) => {
          if (prev.some((t) => t.id === taskId)) return prev;
          const next = [...prev];
          const insertIdx = Math.min(pending.index, next.length);
          next.splice(insertIdx, 0, pending.task);
          return next;
        });
        toast.error(
          getErrorMessage(
            err,
            `Không thể xóa công việc "${pending.task.title}" trên máy chủ.`
          )
        );
      }
    },
    [fetchTags]
  );

  // Handle undoing deletion (restores task immediately)
  const handleUndoDelete = useCallback(
    (taskId: string, toastId: string | number) => {
      const pending = pendingDeletionsRef.current.get(taskId);
      if (pending) {
        clearTimeout(pending.timer);
        pendingDeletionsRef.current.delete(taskId);

        setTasks((prev) => {
          if (prev.some((t) => t.id === taskId)) return prev;
          const next = [...prev];
          const insertIdx = Math.min(pending.index, next.length);
          next.splice(insertIdx, 0, pending.task);
          return next;
        });

        toast.dismiss(toastId);
        toast.success(`Đã khôi phục công việc "${pending.task.title}"!`, {
          duration: 2500,
        });
      } else {
        toast.dismiss(toastId);
      }
    },
    []
  );

  const handleDeleteTask = useCallback(
    (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();

      let deletedTask: TaskItem | undefined;
      let taskIndex = 0;

      setTasks((prev) => {
        taskIndex = prev.findIndex((t) => t.id === id);
        if (taskIndex !== -1) {
          deletedTask = prev[taskIndex];
        }
        return prev.filter((t) => t.id !== id);
      });

      if (!deletedTask) return;

      // Clear any previous pending timer for the same taskId if existed
      const existing = pendingDeletionsRef.current.get(id);
      if (existing) {
        clearTimeout(existing.timer);
        toast.dismiss(existing.toastId);
        pendingDeletionsRef.current.delete(id);
      }

      const durationMs = 6000;
      let toastId: string | number = '';

      const timer = setTimeout(() => {
        handleCommitDelete(id, toastId);
      }, durationMs);

      toastId = toast.custom(
        (t) => (
          <TaskDeleteUndoToast
            toastId={t}
            taskTitle={deletedTask!.title}
            onUndo={() => handleUndoDelete(id, t)}
            onDismiss={() => handleCommitDelete(id, t)}
            durationMs={durationMs}
          />
        ),
        {
          duration: durationMs,
          unstyled: true,
        }
      );

      pendingDeletionsRef.current.set(id, {
        timer,
        task: deletedTask,
        index: taskIndex,
        toastId,
      });
    },
    [handleCommitDelete, handleUndoDelete]
  );

  const handleOpenEditTask = useCallback((task: TaskItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingTask(task);
    setIsEditModalOpen(true);
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    // Capture any pending draft subtask input
    const finalSubtaskTitles = [...newTaskSubtasks];
    if (draftSubtaskInput.trim()) {
      finalSubtaskTitles.push(draftSubtaskInput.trim());
    }

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
      rawDueDate: newTaskDue ? new Date(newTaskDue).toISOString() : null,
      isRecurring: newTaskIsRecurring,
      recurrenceRule: newTaskIsRecurring
        ? newTaskRecurrenceRule === 'DAILY'
          ? 'Hàng ngày'
          : newTaskRecurrenceRule === 'WEEKLY'
          ? 'Hàng tuần'
          : 'Hàng tháng'
        : undefined,
      rawRecurrenceRule: newTaskIsRecurring ? newTaskRecurrenceRule : null,
      tags: [...newTaskTags],
      subtasks: finalSubtaskTitles.map((title, idx) => ({
        id: `draft-${idx}`,
        taskId: tempId,
        title,
        isCompleted: false,
        orderIndex: idx,
      })),
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
        subtasks: finalSubtaskTitles,
      });
      if (res.data.data?.id) {
        const created = res.data.data;
        setTasks((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, id: created.id, subtasks: Array.isArray(created.subtasks) ? created.subtasks : t.subtasks } : t))
        );
      }
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskIsRecurring(false);
      setNewTaskTags([]);
      setNewTaskSubtasks([]);
      setDraftSubtaskInput('');
      fetchTags();
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể tạo công việc trên máy chủ.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tag Management Actions
  const handleRenameTag = useCallback(async (oldTag: string, newTag: string) => {
    try {
      await apiClient.post('/tasks/tags/rename', { oldTag, newTag });
      toast.success(`Đã đổi tên thẻ #${oldTag} thành #${newTag}!`);
      setSelectedTags((prev) =>
        prev.map((t) => (t.toLowerCase() === oldTag.toLowerCase() ? newTag : t))
      );
      setExcludedTags((prev) => {
        const next = prev.map((t) => (t.toLowerCase() === oldTag.toLowerCase() ? newTag : t));
        try {
          localStorage.setItem('flux_tasks_excluded_tags', JSON.stringify(next));
        } catch {}
        return next;
      });
      await Promise.all([fetchTags(), fetchTasks(pagination.page, true)]);
      window.dispatchEvent(new CustomEvent('flux:refresh-data', { detail: { source: 'tasks-tag-rename' } }));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể đổi tên thẻ.'));
      throw err;
    }
  }, [fetchTags, fetchTasks, pagination.page]);

  const handleDeleteTag = useCallback(async (tag: string) => {
    try {
      await apiClient.post('/tasks/tags/delete', { tag });
      toast.success(`Đã xóa thẻ #${tag} khỏi tất cả công việc!`);
      setSelectedTags((prev) => prev.filter((t) => t.toLowerCase() !== tag.toLowerCase()));
      setExcludedTags((prev) => {
        const next = prev.filter((t) => t.toLowerCase() !== tag.toLowerCase());
        try {
          localStorage.setItem('flux_tasks_excluded_tags', JSON.stringify(next));
        } catch {}
        return next;
      });
      await Promise.all([fetchTags(), fetchTasks(1, true)]);
      window.dispatchEvent(new CustomEvent('flux:refresh-data', { detail: { source: 'tasks-tag-delete' } }));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể xóa thẻ.'));
      throw err;
    }
  }, [fetchTags, fetchTasks]);

  const handleUpdateTagColor = useCallback(async (tag: string, color: string) => {
    try {
      await apiClient.patch('/tasks/tags/color', { tag, color });
      toast.success(`Đã cập nhật màu cho thẻ #${tag}!`);
      await fetchTags();
      window.dispatchEvent(new CustomEvent('flux:refresh-data', { detail: { source: 'tasks-tag-color' } }));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật màu thẻ.'));
      throw err;
    }
  }, [fetchTags]);

  const tagColorMap = useMemo(() => {
    const map = new Map<string, string>();
    availableTags.forEach((t) => {
      if (t.color) map.set(t.name.toLowerCase(), t.color);
    });
    return map;
  }, [availableTags]);

  const getTagColor = useCallback((name: string) => {
    return tagColorMap.get(name.toLowerCase()) || '#6366F1';
  }, [tagColorMap]);

  // HTML5 Drag and Drop Handlers for Kanban
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, column: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn((prev) => (prev !== column ? column : prev));
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDraggingTaskId(null);
    setDragOverColumn(null);

    if (!taskId) return;
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.status === targetStatus) return;

    const prevStatus = targetTask.status;
    const isTargetDone = targetStatus === 'DONE';
    const updatedSubtasks = targetTask.subtasks
      ? targetTask.subtasks.map((st) => ({
          ...st,
          isCompleted: isTargetDone,
          completedAt: isTargetDone ? new Date().toISOString() : null,
        }))
      : targetTask.subtasks;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: targetStatus,
              completedAt: isTargetDone ? new Date().toISOString() : undefined,
              subtasks: updatedSubtasks,
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
      window.dispatchEvent(
        new CustomEvent('flux:refresh-data', {
          detail: { source: 'tasks-status-drag', taskId },
        })
      );
    } catch (err: any) {
      // Revert if API fails
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t))
      );
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái công việc.'));
    }
  }, [draggingTaskId, tasks]);

  // Tasks to display in List View according to Focus Mode
  const displayedTasks = useMemo(() => {
    if (!effectiveHideCompleted) return tasks;
    return tasks.filter((t) => t.status !== 'DONE');
  }, [tasks, effectiveHideCompleted]);

  return (
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
              <Tooltip content="Chế độ hiển thị danh sách chi tiết công việc">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                    viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm font-bold' : 'text-slate-500'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>Danh Sách</span>
                </button>
              </Tooltip>
              <Tooltip content="Chế độ bảng Kanban trực quan (kéo thả đổi trạng thái)">
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                    viewMode === 'kanban' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm font-bold' : 'text-slate-500'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Kanban</span>
                </button>
              </Tooltip>
            </div>

            <Tooltip content="Mở biểu mẫu tạo công việc mới với hạn chót và mức ưu tiên">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Việc</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Filters & Tags Dual Stacked Bars */}
        <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-xs">
          {/* Top Search Bar & Focus Mode Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm kiếm công việc theo tiêu đề hoặc mô tả..."
              isLoading={isLoading}
              className="flex-1 max-w-md"
              ariaLabel="Tìm kiếm công việc"
            />

            {/* Focus Mode: Hide / Show Completed Tasks Toggle */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Tooltip
                content={
                  effectiveHideCompleted
                    ? 'Đang ẩn các việc đã hoàn thành để bạn tập trung cao độ vào việc cần làm. Bấm để hiển thị lại.'
                    : 'Ẩn các công việc đã hoàn thành để chỉ tập trung vào các việc chưa xong.'
                }
              >
                <button
                  type="button"
                  onClick={handleToggleHideCompleted}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    effectiveHideCompleted
                      ? 'bg-brand/10 border-brand/40 text-brand font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {effectiveHideCompleted ? (
                    <EyeOff className="w-3.5 h-3.5 text-brand" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>
                    {effectiveHideCompleted ? 'Đang ẩn việc đã xong' : 'Ẩn việc đã xong'}
                  </span>
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Bar 1: Status & Priority Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar-x pb-1 pt-0.5 text-xs scroll-smooth">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 pl-1 flex-shrink-0 mr-1">
              Trạng thái:
            </span>
            {(['ALL', 'TODAY', 'OVERDUE', 'URGENT', 'DONE'] as const).map((key) => {
              const btn = (
                <button
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
              );

              if (key === 'URGENT') {
                return (
                  <Tooltip key={key} content={PRIORITY_TOOLTIPS.URGENT}>
                    {btn}
                  </Tooltip>
                );
              }
              if (key === 'OVERDUE') {
                return (
                  <Tooltip key={key} content="Công việc có hạn chót trước ngày hôm nay mà chưa được hoàn tất.">
                    {btn}
                  </Tooltip>
                );
              }
              return <React.Fragment key={key}>{btn}</React.Fragment>;
            })}
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
              onClick={() => setSelectedTags([])}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex-shrink-0 border ${
                selectedTags.length === 0
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Tất cả thẻ
            </button>

            {availableTags.map((item) => {
              const cleanName = item.name.toLowerCase().trim();
              const isExcluded = excludedTags.some((t) => t.toLowerCase() === cleanName);
              const isActive = selectedTags.some((t) => t.toLowerCase() === cleanName);
              const color = item.color || '#6366F1';

              return (
                <div
                  key={item.name}
                  className={`group flex items-center rounded-xl text-xs transition-all flex-shrink-0 border ${
                    isExcluded
                      ? 'border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                      : isActive
                      ? 'text-white font-bold shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:scale-[1.01]'
                  }`}
                  style={{
                    backgroundColor: isExcluded
                      ? undefined
                      : isActive
                      ? color
                      : `${color}15`,
                    borderColor: isExcluded
                      ? undefined
                      : isActive
                      ? color
                      : `${color}35`,
                  }}
                >
                  {/* Main Tag Selection Button */}
                  <Tooltip
                    content={
                      isExcluded
                        ? `Thẻ #${item.name} đang bị ẩn. Bấm để hiển thị lại thẻ này.`
                        : isActive
                        ? `Bỏ chọn thẻ #${item.name}`
                        : `Lọc các công việc thuộc thẻ #${item.name}`
                    }
                  >
                    <button
                      type="button"
                      onClick={() => (isExcluded ? handleToggleExcludeTag(item.name) : handleToggleTag(item.name))}
                      className="px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer rounded-l-xl"
                    >
                      {isExcluded ? (
                        <EyeOff className="w-3 h-3 text-rose-500 flex-shrink-0" />
                      ) : (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: isActive ? '#ffffff' : color }}
                        />
                      )}
                      <span className={isExcluded ? 'line-through opacity-80' : ''}>#{item.name}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.2 rounded-full font-medium ml-0.5"
                        style={{
                          backgroundColor: isExcluded
                            ? 'rgba(244,63,94,0.15)'
                            : isActive
                            ? 'rgba(255,255,255,0.25)'
                            : 'rgba(0,0,0,0.06)',
                          color: isExcluded
                            ? 'inherit'
                            : isActive
                            ? '#ffffff'
                            : 'inherit',
                        }}
                      >
                        {item.count}
                      </span>
                    </button>
                  </Tooltip>

                  {/* Quick Exclude/Hide Button */}
                  <Tooltip
                    content={
                      isExcluded
                        ? `Đang ẩn các việc có thẻ #${item.name}. Bấm để hiển thị lại.`
                        : `Ẩn tất cả công việc có gắn thẻ #${item.name}`
                    }
                  >
                    <button
                      type="button"
                      onClick={(e) => handleToggleExcludeTag(item.name, e)}
                      aria-label={isExcluded ? `Bỏ ẩn thẻ #${item.name}` : `Ẩn thẻ #${item.name}`}
                      className={`pr-2 pl-0.5 py-1.5 cursor-pointer transition-opacity rounded-r-xl flex items-center ${
                        isExcluded
                          ? 'opacity-100 hover:text-rose-700 dark:hover:text-rose-300'
                          : 'opacity-40 group-hover:opacity-100 hover:text-rose-500'
                      }`}
                    >
                      <EyeOff
                        className={`w-3 h-3 ${
                          isExcluded
                            ? 'text-rose-500'
                            : isActive
                            ? 'text-white/80 hover:text-white'
                            : 'text-slate-400 hover:text-rose-500'
                        }`}
                      />
                    </button>
                  </Tooltip>
                </div>
              );
            })}

            <Tooltip content="Quản lý nhãn phân loại, đổi màu sắc và gắn thẻ cho công việc">
              <button
                type="button"
                onClick={() => setIsTagModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl text-xs border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-brand hover:border-brand transition-all flex items-center gap-1 cursor-pointer flex-shrink-0 ml-auto"
              >
                <Settings className="w-3 h-3" />
                <span>Quản Lý Thẻ</span>
              </button>
            </Tooltip>
          </div>

          {/* Active compound filter summary banner */}
          {(filter !== 'ALL' || selectedTags.length > 0 || excludedTags.length > 0 || searchQuery.trim() !== '' || effectiveHideCompleted) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Đang lọc kết hợp:</span>
              {searchQuery.trim() !== '' && (
                <span className="px-2.5 py-0.5 rounded-lg bg-brand/10 text-brand font-bold flex items-center gap-1.5">
                  <span>Từ khóa: &quot;{searchQuery.trim()}&quot;</span>
                  <Tooltip content="Xóa từ khóa tìm kiếm">
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Xóa từ khóa tìm kiếm"
                      className="p-0.5 rounded-full hover:bg-brand/20 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Tooltip>
                </span>
              )}
              {effectiveHideCompleted && (
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5">
                  <EyeOff className="w-3 h-3" />
                  <span>Ẩn việc hoàn thành</span>
                  <Tooltip content="Hiển thị lại việc đã hoàn thành">
                    <button
                      type="button"
                      onClick={handleToggleHideCompleted}
                      aria-label="Bỏ ẩn việc đã hoàn thành"
                      className="p-0.5 rounded-full hover:bg-indigo-500/20 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Tooltip>
                </span>
              )}
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
              {selectedTags.map((tagName) => {
                const tagColor = getTagColor(tagName);
                return (
                  <span
                    key={tagName}
                    className="px-2.5 py-0.5 rounded-lg font-bold border flex items-center gap-1.5"
                    style={{
                      backgroundColor: `${tagColor}18`,
                      borderColor: `${tagColor}35`,
                      color: tagColor,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tagColor }}
                    />
                    <span>#{tagName}</span>
                    <Tooltip content={`Bỏ lọc thẻ #${tagName}`}>
                      <button
                        type="button"
                        onClick={() => handleToggleTag(tagName)}
                        aria-label={`Bỏ lọc thẻ #${tagName}`}
                        className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Tooltip>
                  </span>
                );
              })}
              {excludedTags.map((tagName) => (
                <span
                  key={`exclude-${tagName}`}
                  className="px-2.5 py-0.5 rounded-lg font-bold border border-dashed border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-1.5"
                >
                  <EyeOff className="w-3 h-3 text-rose-500 flex-shrink-0" />
                  <span>Ẩn: #{tagName}</span>
                  <Tooltip content={`Bỏ ẩn thẻ #${tagName}`}>
                    <button
                      type="button"
                      onClick={(e) => handleToggleExcludeTag(tagName, e)}
                      aria-label={`Bỏ ẩn thẻ #${tagName}`}
                      className="p-0.5 rounded-full hover:bg-rose-200/50 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Tooltip>
                </span>
              ))}
              <button
                type="button"
                onClick={() => {
                  setFilter('ALL');
                  setSelectedTags([]);
                  setExcludedTags([]);
                  try {
                    localStorage.removeItem('flux_tasks_excluded_tags');
                  } catch {}
                  setSearchQuery('');
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
          ) : displayedTasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-4">
              {searchQuery.trim() !== '' ? (
                <>
                  <EmptySearch width={140} height={110} />
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                    Không tìm thấy công việc nào
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Không có công việc nào khớp với từ khóa tìm kiếm &quot;{searchQuery}&quot;. Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Xóa từ khóa tìm kiếm</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <EmptyTasks width={170} height={135} />
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                    {filter === 'ALL' && selectedTags.length === 0 && excludedTags.length === 0
                      ? 'Chưa có công việc nào trong danh sách'
                      : 'Không tìm thấy công việc nào khớp bộ lọc'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {filter === 'ALL' && selectedTags.length === 0 && excludedTags.length === 0
                      ? 'Tạo ngay công việc đầu tiên để lập kế hoạch và theo dõi năng suất cá nhân!'
                      : 'Thử chuyển sang bộ lọc khác hoặc bỏ chọn / bỏ ẩn thẻ để hiển thị thêm kết quả.'}
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
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
                {displayedTasks.map((t) => {
                  const hasSubtasks = Boolean(t.subtasks && t.subtasks.length > 0);
                  const isExpanded = expandedTaskIds.has(t.id);

                  if (hasSubtasks) {
                    return (
                      <CompositeTaskRow
                        key={t.id}
                        task={t}
                        isDescriptionExpanded={isExpanded}
                        onToggleParentStatus={toggleTaskStatus}
                        onToggleSubtask={handleToggleSubtaskFromList}
                        onEditTask={handleOpenEditTask}
                        onDeleteTask={handleDeleteTask}
                        getTagColor={getTagColor}
                        toggleDescriptionExpand={toggleDescriptionExpand}
                      />
                    );
                  }

                  return (
                    <SimpleTaskRow
                      key={t.id}
                      task={t}
                      isDescriptionExpanded={isExpanded}
                      onToggleTaskStatus={toggleTaskStatus}
                      onToggleDescriptionExpand={toggleDescriptionExpand}
                      onEditTask={handleOpenEditTask}
                      onDeleteTask={handleDeleteTask}
                      getTagColor={getTagColor}
                    />
                  );
                })}
              </div>

              {/* Gentle Focus Mode Banner */}
              {effectiveHideCompleted && (
                <div className="py-2.5 px-4 rounded-2xl bg-brand/5 dark:bg-brand/10 border border-brand/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <EyeOff className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                    <span className="font-medium">
                      Chế độ tập trung đang bật: Các công việc đã hoàn thành được ẩn để bạn xử lý việc còn tồn đọng.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleHideCompleted}
                    className="text-brand hover:underline font-bold text-xs cursor-pointer self-start sm:self-auto flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Hiện lại việc đã xong</span>
                  </button>
                </div>
              )}
            </div>
          )
        )}

        {/* Kanban Board View with HTML5 Drag & Drop */}
        {viewMode === 'kanban' && (
          searchQuery.trim() !== '' && tasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-4">
              <EmptySearch width={140} height={110} />
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                Không tìm thấy công việc nào trong bảng Kanban
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Không có công việc nào khớp với từ khóa tìm kiếm &quot;{searchQuery}&quot;. Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa từ khóa tìm kiếm</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between px-1">
                <span>💡 Mẹo: Cầm chuột kéo thả thẻ công việc qua lại giữa các cột để đổi trạng thái tức thì.</span>
                <span className="font-semibold text-slate-500">
                  Đang hiển thị {tasks.length} công việc
                  {effectiveHideCompleted && ' (Đã thu gọn cột Hoàn thành)'}
                </span>
              </div>

              <div
                className={`grid grid-cols-1 gap-6 ${
                  effectiveHideCompleted ? 'md:grid-cols-12' : 'md:grid-cols-3'
                }`}
              >
                {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((status) => {
                  const columnTasks = tasks.filter((t) => t.status === status);
                  const isDragOver = dragOverColumn === status;

                  // Render collapsed dropzone ribbon for DONE column when in Focus Mode
                  if (status === 'DONE' && effectiveHideCompleted) {
                    return (
                      <div
                        key={status}
                        onDragOver={(e) => handleDragOver(e, status)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, status)}
                        className={`p-3 rounded-3xl border transition-all min-h-[360px] flex flex-col items-center justify-between text-center md:col-span-2 ${
                          isDragOver
                            ? 'bg-emerald-500/10 border-2 border-dashed border-emerald-500 ring-4 ring-emerald-500/20'
                            : 'bg-slate-100/70 dark:bg-slate-900/40 border-dashed border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        <div className="space-y-2.5 py-2 flex flex-col items-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                          <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider [writing-mode:vertical-rl] rotate-180 py-2">
                            Đã Hoàn Thành ({columnTasks.length})
                          </div>
                        </div>

                        <div className="space-y-2 py-3 flex flex-col items-center w-full">
                          <div className="text-[10px] text-slate-400 font-medium px-1 leading-tight">
                            {isDragOver ? 'Thả để hoàn thành' : 'Kéo thả vào đây để hoàn tất'}
                          </div>
                          <Tooltip content="Mở rộng cột Đã hoàn thành">
                            <button
                              type="button"
                              onClick={handleToggleHideCompleted}
                              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-brand hover:border-brand transition-all cursor-pointer shadow-xs"
                              aria-label="Mở rộng cột Đã hoàn thành"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  }

                  const colSpanClass =
                    effectiveHideCompleted ? 'md:col-span-5' : '';

                  return (
                    <div
                      key={status}
                      onDragOver={(e) => handleDragOver(e, status)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, status)}
                      className={`p-4 rounded-3xl space-y-3 border transition-all min-h-[360px] flex flex-col ${colSpanClass} ${
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
                          <InfoTooltip
                            content={
                              status === 'TODO'
                                ? 'Các công việc đang chờ thực hiện hoặc cần lên kế hoạch'
                                : status === 'IN_PROGRESS'
                                ? 'Các công việc đang trong quá trình tiến hành xử lý'
                                : 'Các công việc đã hoàn thành nhiệm vụ'
                            }
                            ariaLabel={`Giải thích cột ${
                              status === 'TODO' ? 'Cần làm' : status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Đã hoàn thành'
                            }`}
                          />
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
                          columnTasks.map((t) => {
                          const hasSubtasks = Boolean(t.subtasks && t.subtasks.length > 0);
                          const isExpanded = expandedTaskIds.has(t.id);
                          const isDragging = draggingTaskId === t.id;

                          if (hasSubtasks) {
                            return (
                              <KanbanCompositeCard
                                key={t.id}
                                task={t}
                                isDragging={isDragging}
                                isDescriptionExpanded={isExpanded}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onToggleParentStatus={toggleTaskStatus}
                                onToggleSubtask={handleToggleSubtaskFromList}
                                onEditTask={handleOpenEditTask}
                                onDeleteTask={handleDeleteTask}
                                getTagColor={getTagColor}
                                toggleDescriptionExpand={toggleDescriptionExpand}
                              />
                            );
                          }

                          return (
                            <KanbanTaskCard
                              key={t.id}
                              task={t}
                              isDragging={isDragging}
                              isDescriptionExpanded={isExpanded}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              onToggleParentStatus={toggleTaskStatus}
                              onToggleDescriptionExpand={toggleDescriptionExpand}
                              onEditTask={handleOpenEditTask}
                              onDeleteTask={handleDeleteTask}
                              getTagColor={getTagColor}
                            />
                          );
                        })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Độ ưu tiên</label>
                  <InfoTooltip content={PRIORITY_TOOLTIPS[newTaskPriority] || PRIORITY_TOOLTIPS.URGENT} />
                </div>
                <CustomSelect
                  value={newTaskPriority}
                  onChange={(val) => setNewTaskPriority(val as any)}
                  options={[
                    { value: 'URGENT', label: 'Khẩn cấp', color: '#EF4444' },
                    { value: 'HIGH', label: 'Ưu tiên cao', color: '#F97316' },
                    { value: 'MEDIUM', label: 'Trung bình', color: '#3B82F6' },
                    { value: 'LOW', label: 'Thấp', color: '#6B7280' },
                  ]}
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-tight line-clamp-2">
                  {PRIORITY_TOOLTIPS[newTaskPriority]}
                </p>
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
                <span className="flex items-center gap-1.5">
                  <span>Lặp lại định kỳ (Recurring Engine)</span>
                  <InfoTooltip content="Tự động tạo mới công việc cho chu kỳ tiếp theo ngay sau khi bạn đánh dấu hoàn thành." />
                </span>
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

            {/* Draft Subtasks for Add Task Modal */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ListTodo className="w-3.5 h-3.5 text-brand" />
                  <span>Việc con dự kiến ({newTaskSubtasks.length})</span>
                </label>
                {newTaskSubtasks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNewTaskSubtasks([])}
                    className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* List of draft subtasks */}
              {newTaskSubtasks.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {newTaskSubtasks.map((st, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200"
                    >
                      <span className="truncate flex-1">{idx + 1}. {st}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDraftSubtask(idx)}
                        className="p-0.5 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input to add draft subtask */}
              <div className="flex items-center gap-1.5">
                <input
                  ref={draftSubtaskInputRef}
                  type="text"
                  value={draftSubtaskInput}
                  onChange={(e) => setDraftSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDraftSubtask();
                    }
                  }}
                  placeholder="Gõ việc con và nhấn Enter..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleAddDraftSubtask}
                  disabled={!draftSubtaskInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-brand text-white font-semibold text-xs hover:bg-brand-hover disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
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

        {/* Edit Task Modal */}
        <EditTaskModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTask(null);
          }}
          task={editingTask}
          availableTags={availableTags}
          onSuccess={() => {
            fetchTasks(pagination.page, true);
            fetchTags();
          }}
        />
      </div>
  );
};
