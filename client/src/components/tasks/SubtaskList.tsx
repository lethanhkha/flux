import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
  X,
  ListTodo,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../api/client';
import { toast } from 'sonner';
import { Tooltip } from '../common/Tooltip';
import { getSubtaskProgressConfig } from '../../lib/taskUtils';

export interface SubtaskItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string | null;
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
}

interface SubtaskListProps {
  taskId: string;
  subtasks: SubtaskItem[];
  onSubtasksChange: (subtasks: SubtaskItem[]) => void;
  disabled?: boolean;
}

export const SubtaskList = React.memo<SubtaskListProps>(({
  taskId,
  subtasks,
  onSubtasksChange,
  disabled = false,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const total = subtasks.length;
  const completed = subtasks.filter((s) => s.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Add new subtask
  const handleAddSubtask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanTitle = newTitle.trim();
    if (!cleanTitle || isAdding || disabled) return;

    setIsAdding(true);

    // Optimistic temporary ID
    const tempId = `temp-${Date.now()}`;
    const optimisticItem: SubtaskItem = {
      id: tempId,
      taskId,
      title: cleanTitle,
      isCompleted: false,
      orderIndex: subtasks.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const previousList = [...subtasks];
    const updatedList = [...subtasks, optimisticItem];
    onSubtasksChange(updatedList);
    setNewTitle('');
    inputRef.current?.focus();
    setTimeout(() => inputRef.current?.focus(), 0);

    try {
      const res = await apiClient.post(`/tasks/${taskId}/subtasks`, {
        title: cleanTitle,
      });
      const createdItem: SubtaskItem = res.data?.data;
      if (createdItem) {
        onSubtasksChange(
          updatedList.map((st) => (st.id === tempId ? createdItem : st))
        );
      }
      window.dispatchEvent(new CustomEvent('flux:refresh-data', { detail: { source: 'tasks-subtask-modal', taskId } }));
    } catch (err: any) {
      onSubtasksChange(previousList);
      toast.error(getErrorMessage(err, 'Không thể thêm việc con.'));
    } finally {
      setIsAdding(false);
      inputRef.current?.focus();
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  // Toggle subtask status
  const handleToggleSubtask = async (subtaskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (disabled) return;

    const target = subtasks.find((s) => s.id === subtaskId);
    if (!target) return;

    const nextState = !target.isCompleted;
    const previousList = [...subtasks];

    // Optimistic UI
    const updatedList = subtasks.map((st) =>
      st.id === subtaskId
        ? {
            ...st,
            isCompleted: nextState,
            completedAt: nextState ? new Date().toISOString() : null,
          }
        : st
    );
    onSubtasksChange(updatedList);

    try {
      await apiClient.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
      window.dispatchEvent(new CustomEvent('flux:refresh-data', { detail: { source: 'tasks-subtask-modal', taskId } }));
    } catch (err: any) {
      onSubtasksChange(previousList);
      toast.error(getErrorMessage(err, 'Không thể cập nhật việc con.'));
    }
  };

  // Start inline editing
  const startEditing = (subtask: SubtaskItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (disabled) return;
    setEditingId(subtask.id);
    setEditTitle(subtask.title);
  };

  // Save inline edit
  const handleSaveEdit = async (subtaskId: string) => {
    const cleanTitle = editTitle.trim();
    if (!cleanTitle || isSavingEdit) return;

    const previousList = [...subtasks];
    const updatedList = subtasks.map((st) =>
      st.id === subtaskId ? { ...st, title: cleanTitle } : st
    );
    onSubtasksChange(updatedList);
    setEditingId(null);

    setIsSavingEdit(true);
    try {
      await apiClient.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, {
        title: cleanTitle,
      });
      window.dispatchEvent(new CustomEvent('flux:refresh-data', { detail: { source: 'tasks-subtask-modal', taskId } }));
    } catch (err: any) {
      onSubtasksChange(previousList);
      toast.error(getErrorMessage(err, 'Không thể đổi tên việc con.'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete subtask
  const handleDeleteSubtask = async (subtaskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (disabled) return;

    const previousList = [...subtasks];
    const updatedList = subtasks.filter((s) => s.id !== subtaskId);
    onSubtasksChange(updatedList);

    try {
      await apiClient.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
      toast.success('Đã xóa việc con');
      window.dispatchEvent(new CustomEvent('flux:refresh-data', { detail: { source: 'tasks-subtask-modal', taskId } }));
    } catch (err: any) {
      onSubtasksChange(previousList);
      toast.error(getErrorMessage(err, 'Không thể xóa việc con.'));
    }
  };

  // Reorder (Move Up / Down)
  const handleMoveOrder = async (index: number, direction: 'UP' | 'DOWN', e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (disabled) return;
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subtasks.length) return;

    const reordered = [...subtasks];
    const [movedItem] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, movedItem);

    // Update local orderIndex
    const updated = reordered.map((item, idx) => ({ ...item, orderIndex: idx }));
    const previousList = [...subtasks];
    onSubtasksChange(updated);

    try {
      await apiClient.put(`/tasks/${taskId}/subtasks/reorder`, {
        subtaskIds: updated.map((st) => st.id),
      });
    } catch (err: any) {
      onSubtasksChange(previousList);
      toast.error(getErrorMessage(err, 'Không thể sắp xếp lại việc con.'));
    }
  };

  const progressConfig = getSubtaskProgressConfig(percentage);

  return (
    <div className="space-y-3">
      {/* Header and Multi-tier Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <ListTodo className="w-4 h-4 text-brand" />
            <span>Danh sách việc con (Sub-tasks)</span>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-bold tabular-nums ${progressConfig.badgeText}`}>
                {completed}/{total} ({percentage}%)
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${progressConfig.badgeBg}`}>
                {progressConfig.stageLabel}
              </span>
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
            <div
              className={`h-full transition-all duration-300 rounded-full ${progressConfig.barGradient}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Subtasks Item List */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {subtasks.length === 0 ? (
          <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-[11px]">
            Chưa có việc con nào. Nhập tiêu đề bên dưới và nhấn Enter để thêm!
          </div>
        ) : (
          subtasks.map((st, idx) => (
            <div
              key={st.id}
              className={`group px-3 py-2 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                st.isCompleted
                  ? 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              {/* Checkbox toggle */}
              <button
                type="button"
                onClick={(e) => handleToggleSubtask(st.id, e)}
                disabled={disabled}
                aria-label={`Đổi trạng thái: ${st.title}`}
                className="flex-shrink-0 text-slate-400 hover:text-brand transition-colors cursor-pointer disabled:cursor-not-allowed focus-ring rounded"
              >
                {st.isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-brand" />
                )}
              </button>

              {/* Title or Inline Edit */}
              <div className="flex-1 min-w-0">
                {editingId === st.id ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEdit(st.id);
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                        }
                      }}
                      className="w-full px-2 py-0.5 rounded-lg border border-brand bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(st.id)}
                      disabled={isSavingEdit}
                      className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span
                    onDoubleClick={(e) => startEditing(st, e)}
                    className={`text-xs block truncate select-text cursor-pointer ${
                      st.isCompleted
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                    title="Bấm đúp chuột để chỉnh sửa"
                  >
                    {st.title}
                  </span>
                )}
              </div>

              {/* Action Buttons (Hover or active) */}
              {editingId !== st.id && (
                <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {/* Move Up */}
                  <Tooltip content="Chuyển lên trên">
                    <button
                      type="button"
                      disabled={idx === 0 || disabled}
                      onClick={(e) => handleMoveOrder(idx, 'UP', e)}
                      aria-label="Chuyển lên"
                      className="p-1 rounded text-slate-400 hover:text-brand hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>

                  {/* Move Down */}
                  <Tooltip content="Chuyển xuống dưới">
                    <button
                      type="button"
                      disabled={idx === subtasks.length - 1 || disabled}
                      onClick={(e) => handleMoveOrder(idx, 'DOWN', e)}
                      aria-label="Chuyển xuống"
                      className="p-1 rounded text-slate-400 hover:text-brand hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>

                  {/* Edit title */}
                  <Tooltip content="Sửa tên việc con">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(e) => startEditing(st, e)}
                      aria-label="Chỉnh sửa tên"
                      className="p-1 rounded text-slate-400 hover:text-brand hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>

                  {/* Delete */}
                  <Tooltip content="Xóa việc con này">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(e) => handleDeleteSubtask(st.id, e)}
                      aria-label="Xóa việc con"
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Add Subtask Input */}
      <div className="flex items-center gap-2 pt-1">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleAddSubtask(e);
              }
            }}
            placeholder="Thêm việc con mới... (nhấn Enter để thêm)"
            className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand font-medium disabled:opacity-50"
          />
          {newTitle.trim() && (
            <button
              type="button"
              onClick={() => setNewTitle('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAddSubtask(e);
          }}
          disabled={!newTitle.trim() || isAdding || disabled}
          className="px-3 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isAdding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          <span>Thêm</span>
        </button>
      </div>
    </div>
  );
});

SubtaskList.displayName = 'SubtaskList';
