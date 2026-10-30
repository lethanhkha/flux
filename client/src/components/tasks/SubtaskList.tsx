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
  Calendar,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../api/client';
import { toast } from 'sonner';
import { Tooltip } from '../common/Tooltip';
import { getRemainingDaysInfo, getSubtaskProgressConfig } from '../../lib/taskUtils';

export interface SubtaskItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string | null;
  orderIndex: number;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface SubtaskListProps {
  taskId: string;
  parentDueDate?: string | null;
  subtasks: SubtaskItem[];
  onSubtasksChange: (subtasks: SubtaskItem[]) => void;
  disabled?: boolean;
}

// Helpers for datetime input conversion
const toDateTimeLocal = (isoStr?: string | null): string => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toISOString = (dtLocal?: string): string | null => {
  if (!dtLocal) return null;
  const d = new Date(dtLocal);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};

const isLaterThanParent = (childDue?: string | null, parentDue?: string | null): boolean => {
  if (!childDue || !parentDue) return false;
  const cTime = new Date(childDue).getTime();
  const pTime = new Date(parentDue).getTime();
  return !isNaN(cTime) && !isNaN(pTime) && cTime > pTime;
};

export const SubtaskList = React.memo<SubtaskListProps>(({
  taskId,
  parentDueDate,
  subtasks,
  onSubtasksChange,
  disabled = false,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
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

    const isoDueDate = toISOString(newDueDate);
    const tempId = `temp-${Date.now()}`;
    const optimisticItem: SubtaskItem = {
      id: tempId,
      taskId,
      title: cleanTitle,
      isCompleted: false,
      orderIndex: subtasks.length,
      dueDate: isoDueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const previousList = [...subtasks];
    const updatedList = [...subtasks, optimisticItem];
    onSubtasksChange(updatedList);
    setNewTitle('');
    setNewDueDate('');
    setShowDuePicker(false);
    inputRef.current?.focus();
    setTimeout(() => inputRef.current?.focus(), 0);

    try {
      const res = await apiClient.post(`/tasks/${taskId}/subtasks`, {
        title: cleanTitle,
        dueDate: isoDueDate,
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
    setEditDueDate(toDateTimeLocal(subtask.dueDate));
  };

  // Save inline edit
  const handleSaveEdit = async (subtaskId: string) => {
    const cleanTitle = editTitle.trim();
    if (!cleanTitle || isSavingEdit) return;

    const isoDueDate = toISOString(editDueDate);
    const previousList = [...subtasks];
    const updatedList = subtasks.map((st) =>
      st.id === subtaskId ? { ...st, title: cleanTitle, dueDate: isoDueDate } : st
    );
    onSubtasksChange(updatedList);
    setEditingId(null);

    setIsSavingEdit(true);
    try {
      await apiClient.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, {
        title: cleanTitle,
        dueDate: isoDueDate,
      });
      window.dispatchEvent(new CustomEvent('flux:refresh-data', { detail: { source: 'tasks-subtask-modal', taskId } }));
    } catch (err: any) {
      onSubtasksChange(previousList);
      toast.error(getErrorMessage(err, 'Không thể cập nhật việc con.'));
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

  // Preset date helpers for quick add
  const setPresetToday = () => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    setNewDueDate(toDateTimeLocal(d.toISOString()));
  };

  const setPresetTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    setNewDueDate(toDateTimeLocal(d.toISOString()));
  };

  const setPresetParentDue = () => {
    if (parentDueDate) {
      setNewDueDate(toDateTimeLocal(parentDueDate));
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
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {subtasks.length === 0 ? (
          <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-[11px]">
            Chưa có việc con nào. Nhập tiêu đề và chọn hạn chót bên dưới để thêm!
          </div>
        ) : (
          subtasks.map((st, idx) => {
            const hasDue = Boolean(st.dueDate);
            const dueInfo = hasDue ? getRemainingDaysInfo(st.dueDate, st.isCompleted ? 'DONE' : 'TODO') : null;
            const isLateThanParentWarning = !st.isCompleted && hasDue && isLaterThanParent(st.dueDate, parentDueDate);

            return (
              <div
                key={st.id}
                className={`group px-3 py-2.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                  st.isCompleted
                    ? 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {/* Main Row */}
                <div className="flex items-center justify-between gap-2.5">
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

                  {/* Title and Due Badge or Inline Edit */}
                  <div className="flex-1 min-w-0">
                    {editingId === st.id ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
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
                            className="w-full px-2 py-1 rounded-lg border border-brand bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                            placeholder="Tiêu đề việc con..."
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(st.id)}
                            disabled={isSavingEdit}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer"
                            title="Lưu"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Hủy"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Inline Due Date Editor */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px] pt-0.5">
                          <div className="flex items-center gap-1 text-slate-500 font-medium">
                            <Clock className="w-3 h-3 text-brand" />
                            <span>Hạn chót:</span>
                          </div>
                          <input
                            type="datetime-local"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand"
                          />
                          {editDueDate && (
                            <button
                              type="button"
                              onClick={() => setEditDueDate('')}
                              className="text-[10px] text-rose-500 hover:underline font-medium cursor-pointer"
                            >
                              Xóa hạn
                            </button>
                          )}
                          {isLaterThanParent(editDueDate, parentDueDate) && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-medium">
                              <AlertCircle className="w-3 h-3" /> Muộn hơn việc chính
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
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

                        {/* Due Date Badge */}
                        {dueInfo ? (
                          <Tooltip
                            content={
                              isLateThanParentWarning
                                ? `Hạn: ${dueInfo.formattedDue} (Lưu ý: Hạn việc con đang muộn hơn hạn công việc chính)`
                                : `Hạn chót: ${dueInfo.formattedDue}`
                            }
                          >
                            <button
                              type="button"
                              onClick={(e) => startEditing(st, e)}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                                st.isCompleted
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                  : dueInfo.colorClasses
                              }`}
                            >
                              <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                              <span>{dueInfo.shortLabel}</span>
                              {isLateThanParentWarning && (
                                <AlertCircle className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />
                              )}
                            </button>
                          </Tooltip>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => startEditing(st, e)}
                            className="inline-flex items-center gap-1 text-[10px] text-brand hover:text-brand-hover bg-brand/10 hover:bg-brand/15 px-2 py-0.5 rounded-md border border-brand/20 font-semibold cursor-pointer transition-colors"
                            title="Đặt hạn chót cho việc con này"
                          >
                            <Calendar className="w-3 h-3 text-brand" />
                            <span>+ Đặt hạn</span>
                          </button>
                        )}
                      </div>
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

                      {/* Edit title & due date */}
                      <Tooltip content="Sửa tiêu đề & hạn chót">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={(e) => startEditing(st, e)}
                          aria-label="Chỉnh sửa"
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
              </div>
            );
          })
        )}
      </div>

      {/* Quick Add Subtask Input & Due Date Control */}
      <div className="space-y-1.5 pt-1">
        {/* Selected Due Date Pill Chip */}
        {newDueDate && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 bg-brand/5 border border-brand/20 px-2.5 py-1 rounded-lg w-fit">
            <Clock className="w-3 h-3 text-brand" />
            <span className="font-semibold text-brand">Hạn việc con:</span>
            <span>{new Date(newDueDate).toLocaleString('vi-VN')}</span>
            {isLaterThanParent(newDueDate, parentDueDate) && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-medium ml-1">
                <AlertCircle className="w-3 h-3" /> (Muộn hơn việc chính)
              </span>
            )}
            <button
              type="button"
              onClick={() => setNewDueDate('')}
              className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer ml-1"
              title="Xóa hạn đã chọn"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
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

          {/* Toggle Due Date Picker Button */}
          <button
            type="button"
            onClick={() => setShowDuePicker(!showDuePicker)}
            disabled={disabled}
            className={`px-2.5 py-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              showDuePicker || newDueDate
                ? 'bg-brand/15 border-brand text-brand'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            }`}
            title="Gán hạn chót cho việc con sắp thêm"
          >
            <Calendar className="w-3.5 h-3.5 text-brand" />
            <span>{newDueDate ? 'Đã gán hạn' : 'Hạn chót'}</span>
          </button>

          {/* Submit Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddSubtask(e);
            }}
            disabled={!newTitle.trim() || isAdding || disabled}
            className="px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isAdding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>Thêm</span>
          </button>
        </div>

        {/* Quick Presets Bar Always Visible */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 pt-0.5">
          <span className="font-medium flex items-center gap-1 text-slate-500">
            <Clock className="w-3 h-3 text-brand" /> Hạn việc con sắp thêm:
          </span>
          <button
            type="button"
            onClick={setPresetToday}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer font-medium ${
              newDueDate && newDueDate.endsWith('T18:00') && newDueDate.startsWith(new Date().toISOString().slice(0, 10))
                ? 'bg-brand text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-brand hover:text-white text-slate-700 dark:text-slate-300'
            }`}
          >
            Hôm nay (18:00)
          </button>
          <button
            type="button"
            onClick={setPresetTomorrow}
            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-brand hover:text-white transition-colors cursor-pointer font-medium text-slate-700 dark:text-slate-300"
          >
            Ngày mai (18:00)
          </button>
          {parentDueDate && (
            <button
              type="button"
              onClick={setPresetParentDue}
              className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer font-medium"
            >
              Cùng hạn việc chính
            </button>
          )}
          {newDueDate && (
            <button
              type="button"
              onClick={() => setNewDueDate('')}
              className="px-2 py-0.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer font-medium"
            >
              Xóa hạn
            </button>
          )}
        </div>

        {/* Due Date Picker Panel & Quick Presets */}
        {showDuePicker && (
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-brand" /> Chọn hạn chót cho việc con:
              </span>
              <button
                type="button"
                onClick={() => setShowDuePicker(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="datetime-local"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand font-medium"
              />

              {/* Quick Presets */}
              <div className="flex items-center gap-1 text-[11px] flex-wrap">
                <button
                  type="button"
                  onClick={setPresetToday}
                  className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand hover:text-white transition-colors cursor-pointer font-medium"
                >
                  Hôm nay (18:00)
                </button>
                <button
                  type="button"
                  onClick={setPresetTomorrow}
                  className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand hover:text-white transition-colors cursor-pointer font-medium"
                >
                  Ngày mai (18:00)
                </button>
                {parentDueDate && (
                  <button
                    type="button"
                    onClick={setPresetParentDue}
                    className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer font-medium"
                  >
                    Cùng hạn việc chính
                  </button>
                )}
                {newDueDate && (
                  <button
                    type="button"
                    onClick={() => setNewDueDate('')}
                    className="px-2 py-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer font-medium"
                  >
                    Xóa hạn
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

SubtaskList.displayName = 'SubtaskList';
