import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Clock,
  MapPin,
  Repeat,
  FileText,
  Tag,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { apiClient, getErrorMessage } from '../../api/client';
import { toast } from 'sonner';
import { ReminderItem } from '../../lib/reminderUtils';
import { RemindBeforeSelect } from './RemindBeforeSelect';
import { TagSelect, TagOption } from '../notes/TagSelect';

interface EditReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder?: ReminderItem | null;
  onSaved: (reminder: ReminderItem) => void;
}

export const EditReminderModal: React.FC<EditReminderModalProps> = ({
  isOpen,
  onClose,
  reminder,
  onSaved,
}) => {
  const isEditing = Boolean(reminder);

  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [remindBefore, setRemindBefore] = useState<number>(0);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [tags, setTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Default time helper: Next hour rounded
  const getDefaultDateTime = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
    d.setSeconds(0);
    // Convert to YYYY-MM-DDTHH:mm in local time
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (!isOpen) {
      setErrorMsg('');
      return;
    }

    // Load available reminder tags
    apiClient
      .get('/reminders/tags')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setAvailableTags(res.data.data);
        }
      })
      .catch(() => {});

    if (reminder) {
      setTitle(reminder.title || '');
      // Format existing date to local datetime string
      const d = new Date(reminder.scheduledAt);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      setScheduledAt(local.toISOString().slice(0, 16));
      setRemindBefore(reminder.remindBefore ?? 0);
      setLocation(reminder.location || '');
      setDescription(reminder.description || '');
      setIsRecurring(Boolean(reminder.isRecurring));
      setRecurrenceRule(reminder.recurrenceRule || 'WEEKLY');
      setTags(Array.isArray(reminder.tags) ? reminder.tags : []);
    } else {
      setTitle('');
      setScheduledAt(getDefaultDateTime());
      setRemindBefore(0);
      setLocation('');
      setDescription('');
      setIsRecurring(false);
      setRecurrenceRule('WEEKLY');
      setTags([]);
    }
  }, [isOpen, reminder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề nhắc hẹn');
      return;
    }

    if (!scheduledAt) {
      setErrorMsg('Vui lòng chọn thời gian diễn ra');
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      setErrorMsg('Thời gian không hợp lệ');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        title: title.trim(),
        scheduledAt: scheduledDate.toISOString(),
        remindBefore: Number(remindBefore),
        location: location.trim() || null,
        description: description.trim() || null,
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : null,
        tags,
      };

      let res;
      if (isEditing && reminder) {
        res = await apiClient.patch(`/reminders/${reminder.id}`, payload);
        toast.success('Đã cập nhật nhắc hẹn thành công');
      } else {
        res = await apiClient.post('/reminders', payload);
        toast.success('Đã tạo lịch nhắc hẹn mới thành công');
      }

      onSaved(res.data?.data);
      onClose();
    } catch (err) {
      const message = getErrorMessage(err);
      setErrorMsg(message);
      toast.error(message || 'Không thể lưu nhắc hẹn. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Chỉnh Sửa Nhắc Hẹn' : 'Tạo Nhắc Hẹn Mới'}
              </h3>
              <p className="text-xs text-slate-500">
                Nhắc nhở làm một việc đúng vào thời điểm cụ thể
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tiêu đề nhắc hẹn <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: 13h đi dự khai mạc, Khám răng định kỳ, Họp tổng kết..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            />
          </div>

          {/* Scheduled Date Time & Remind Before */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand" />
                <span>Thời điểm diễn ra</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              />
            </div>

            <div>
              <RemindBeforeSelect value={remindBefore} onChange={setRemindBefore} />
            </div>
          </div>

          {/* Location / Meeting URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand" />
              <span>Địa điểm hoặc Link họp trực tuyến (tùy chọn)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="VD: Hội trường A, Phòng họp 302, hoặc https://meet.google.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand" />
              <span>Ghi chú / Chuẩn bị trước</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú chi tiết, tài liệu cần mang theo, nội dung chuẩn bị..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none"
            />
          </div>

          {/* Recurring & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-slate-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                />
                <Repeat className="w-3.5 h-3.5 text-brand" />
                <span>Lặp lại định kỳ</span>
              </label>

              {isRecurring && (
                <select
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                >
                  <option value="DAILY">Hàng ngày</option>
                  <option value="WEEKLY">Hàng tuần</option>
                  <option value="MONTHLY">Hàng tháng</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand" />
                <span>Thẻ phân loại (Tags)</span>
              </label>
              <TagSelect
                availableTags={availableTags}
                selectedTags={tags}
                onChange={setTags}
                placeholder="Chọn hoặc nhập thẻ mới..."
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-md shadow-brand/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Lưu Thay Đổi' : 'Tạo Nhắc Hẹn'}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
