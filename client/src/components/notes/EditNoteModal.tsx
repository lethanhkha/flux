import React, { useState, useEffect } from 'react';
import { Edit3, X, Check, Pin, Loader2 } from 'lucide-react';
import { apiClient, getErrorMessage } from '../../api/client';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { TagSelect } from './TagSelect';
import { MarkdownEditor } from './MarkdownEditor';
import { ColorPickerPopover } from '../common/ColorPickerPopover';

export interface NoteItemData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  color: string;
  updatedAt: string;
}

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteItemData | null;
  availableTags: { name: string; count: number; color?: string }[];
  onSuccess: (updatedNote?: any) => void;
}

export const EditNoteModal: React.FC<EditNoteModalProps> = ({
  isOpen,
  onClose,
  note,
  availableTags,
  onSuccess,
}) => {
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editColor, setEditColor] = useState('#6366F1');
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && note) {
      setEditTitle(note.title || '');
      setEditContent(note.content || '');
      setEditTags(Array.isArray(note.tags) ? [...note.tags] : []);
      setEditColor(note.color || '#6366F1');
      setEditIsPinned(Boolean(note.isPinned));
      setIsColorPickerOpen(false);
    }
  }, [isOpen, note]);

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

  if (!isOpen || !note) return null;

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      toast.error('Tiêu đề ghi chú không được để trống.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalTags = editTags.length > 0 ? editTags : ['chung'];
      const payload: any = {
        title: editTitle.trim(),
        content: editContent.trim(),
        color: editColor,
        tags: finalTags,
        isPinned: editIsPinned,
      };

      const res = await apiClient.patch(`/notes/${note.id}`, payload);

      toast.success('Đã lưu thay đổi ghi chú thành công!');
      onSuccess(res.data?.data);
      onClose();
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật ghi chú.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isSubmitting}
      ariaLabelledBy="edit-note-modal-title"
      maxWidth="lg"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
            style={{ backgroundColor: editColor }}
          >
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h3 id="edit-note-modal-title" className="font-bold text-base text-slate-900 dark:text-slate-100">
              Chỉnh Sửa Ghi Chú
            </h3>
            <p className="text-[11px] text-slate-400">
              Cập nhật tiêu đề, định dạng Markdown, nhãn phân loại và màu sắc
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Color Picker Swatch */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold hover:border-brand/40 transition-colors cursor-pointer"
              title="Đổi màu ghi chú"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shadow-xs flex-shrink-0"
                style={{ backgroundColor: editColor }}
              />
              <span className="text-[11px] text-slate-600 dark:text-slate-300">Đổi màu</span>
            </button>
            {isColorPickerOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50">
                <ColorPickerPopover
                  currentColor={editColor}
                  tagName={editTitle || 'ghi-chu'}
                  onSelectColor={(c) => {
                    setEditColor(c);
                    setIsColorPickerOpen(false);
                  }}
                  onClose={() => setIsColorPickerOpen(false)}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng chỉnh sửa ghi chú"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <form onSubmit={handleUpdateNote} className="space-y-4 text-xs mt-3">
        {/* Title */}
        <div>
          <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
            Tiêu đề ghi chú <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="VD: Kế hoạch tuần tới..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand font-medium text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
            Thẻ phân loại (Tags)
          </label>
          <TagSelect
            availableTags={availableTags}
            selectedTags={editTags}
            onChange={setEditTags}
            placeholder="Chọn hoặc nhập thẻ mới..."
          />
        </div>

        {/* Pin toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={editIsPinned}
              onChange={(e) => setEditIsPinned(e.target.checked)}
              className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <Pin className={`w-3.5 h-3.5 ${editIsPinned ? 'text-brand fill-current' : 'text-slate-400'}`} />
              <span>Ghim ghi chú lên đầu trang</span>
            </span>
          </label>
          {editIsPinned && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-brand/10 text-brand font-bold">
              Đang ghim
            </span>
          )}
        </div>

        {/* Content (Markdown Editor with Preview) */}
        <div>
          <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
            Nội dung ghi chú (Markdown)
          </label>
          <MarkdownEditor
            value={editContent}
            onChange={setEditContent}
            placeholder="Nhập nội dung ghi chú (hỗ trợ tiêu đề, danh sách, bảng, task list...)"
            rows={10}
          />
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
                <Check className="w-3.5 h-3.5" />
                <span>Lưu Thay Đổi</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
