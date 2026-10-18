import React, { useState, useEffect } from 'react';
import { Edit3, X, CheckSquare, Clock, Repeat, Loader2 } from 'lucide-react';
import { apiClient, getErrorMessage } from '../../api/client';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { TagSelect } from '../notes/TagSelect';
import { TaskTagItem } from './TaskTagModal';
import { InfoTooltip } from '../common/Tooltip';
import { PRIORITY_TOOLTIPS } from '../../lib/taskUtils';

export interface TaskItemData {
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
}

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItemData | null;
  availableTags: TaskTagItem[];
  onSuccess: (updatedTask?: any) => void;
}

const formatToDateTimeLocal = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  availableTags,
  onSuccess,
}) => {
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO');
  const [editPriority, setEditPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [editDue, setEditDue] = useState('');
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRecurrenceRule, setEditRecurrenceRule] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      setEditTitle(task.title || '');
      setEditDescription(task.description || '');
      setEditStatus(task.status || 'TODO');
      setEditPriority(task.priority || 'MEDIUM');
      setEditDue(formatToDateTimeLocal(task.rawDueDate));
      setEditIsRecurring(Boolean(task.isRecurring));
      setEditRecurrenceRule(task.rawRecurrenceRule || 'WEEKLY');
      setEditTags(Array.isArray(task.tags) ? [...task.tags] : []);
    }
  }, [isOpen, task]);

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !task) return null;

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      toast.error('Tiêu đề công việc không được để trống.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        status: editStatus,
        priority: editPriority,
        dueDate: editDue ? new Date(editDue).toISOString() : null,
        isRecurring: editIsRecurring,
        recurrenceRule: editIsRecurring ? editRecurrenceRule : null,
        tags: editTags,
      };

      const res = await apiClient.patch(`/tasks/${task.id}`, payload);

      toast.success('Đã cập nhật công việc thành công!');
      onSuccess(res.data?.data);
      onClose();
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật công việc.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isSubmitting}
      ariaLabelledBy="edit-task-modal-title"
      maxWidth="md"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h3 id="edit-task-modal-title" className="font-bold text-base text-slate-900 dark:text-slate-100">
              Chỉnh Sửa Công Việc
            </h3>
            <p className="text-[11px] text-slate-400">
              Cập nhật thông tin chi tiết, hạn chót và chu kỳ lặp lại
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Đóng chỉnh sửa công việc"
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleUpdateTask} className="space-y-4 text-xs mt-3">
        {/* Title */}
        <div>
          <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
            Tiêu đề công việc <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="VD: Kiểm tra và nộp báo cáo thuế..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand font-medium text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Description */}
        <div>
          <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
            Mô tả chi tiết (Tùy chọn)
          </label>
          <textarea
            rows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Nhập ghi chú hoặc yêu cầu chi tiết cho công việc..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Trạng thái
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="TODO">Cần làm</option>
              <option value="IN_PROGRESS">Đang thực hiện</option>
              <option value="DONE">Đã hoàn thành</option>
            </select>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Độ ưu tiên
              </label>
              <InfoTooltip content={PRIORITY_TOOLTIPS[editPriority] || PRIORITY_TOOLTIPS.URGENT} />
            </div>
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="URGENT">Khẩn cấp</option>
              <option value="HIGH">Ưu tiên cao</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="LOW">Thấp</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight line-clamp-2">
              {PRIORITY_TOOLTIPS[editPriority]}
            </p>
          </div>
        </div>

        {/* Due Date with Quick Clear Button */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand" />
              <span>Hạn chót hoàn thành</span>
            </label>
            {editDue && (
              <button
                type="button"
                onClick={() => setEditDue('')}
                className="text-[11px] text-rose-500 hover:underline cursor-pointer"
              >
                Xóa hạn chót
              </button>
            )}
          </div>
          <input
            type="datetime-local"
            value={editDue}
            onChange={(e) => setEditDue(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 font-medium"
          />
        </div>

        {/* Recurring Engine Toggle */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={editIsRecurring}
              onChange={(e) => setEditIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Repeat className="w-3.5 h-3.5 text-indigo-500" />
              <span>Lặp lại định kỳ (Recurring Engine)</span>
            </span>
          </label>
          {editIsRecurring && (
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((rule) => (
                <button
                  key={rule}
                  type="button"
                  onClick={() => setEditRecurrenceRule(rule)}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    editRecurrenceRule === rule
                      ? 'bg-brand text-white border-brand shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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

        {/* Tags input */}
        <div>
          <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
            Gắn thẻ phân loại (Tags)
          </label>
          <TagSelect
            availableTags={availableTags}
            selectedTags={editTags}
            onChange={setEditTags}
            placeholder="Chọn hoặc gõ tên thẻ mới..."
          />

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-slate-400">
            <span className="font-medium">Gợi ý nhanh:</span>
            {['Dự án', 'Công việc', 'Học tập', 'Tài chính', 'Gia đình', 'Cá nhân']
              .filter((s) => !editTags.includes(s.toLowerCase()))
              .map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    const clean = suggestion.toLowerCase();
                    if (!editTags.includes(clean)) {
                      setEditTags([...editTags, clean]);
                    }
                  }}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 hover:bg-brand/10 hover:text-brand text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  +{suggestion}
                </button>
              ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Lưu Thay Đổi</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
