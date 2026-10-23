import React, { useState, useEffect } from 'react';
import { FileText, X, Check, Pin, Loader2, Sparkles } from 'lucide-react';
import { apiClient, getErrorMessage } from '../../api/client';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { TagSelect } from './TagSelect';
import { MarkdownEditor } from './MarkdownEditor';
import { ColorPickerPopover } from '../common/ColorPickerPopover';

export interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTags: { name: string; count: number; color?: string }[];
  onSuccess: (newNote?: any) => void;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  availableTags,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>(['tài-chính']);
  const [color, setColor] = useState('#6366F1');
  const [isPinned, setIsPinned] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setTags(['tài-chính']);
      setColor('#6366F1');
      setIsPinned(false);
      setIsColorPickerOpen(false);
    }
  }, [isOpen]);

  // Keyboard accessibility: Escape to close
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

  if (!isOpen) return null;

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Tiêu đề ghi chú không được để trống.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalTags = tags.length > 0 ? tags : ['chung'];
      const payload = {
        title: title.trim(),
        content: content.trim(),
        tags: finalTags,
        color,
        isPinned,
      };

      const res = await apiClient.post('/notes', payload);
      toast.success('Đã lưu ghi chú mới vào kho tri thức!');
      onSuccess(res.data?.data);
      onClose();
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể tạo ghi chú mới.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isSubmitting}
      ariaLabelledBy="add-note-modal-title"
      maxWidth="max-w-lg lg:max-w-5xl xl:max-w-6xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center font-bold text-white shadow-xs transition-colors"
            style={{ backgroundColor: color }}
          >
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 id="add-note-modal-title" className="font-bold text-base text-slate-900 dark:text-slate-100">
              Soạn Thảo Ghi Chú Mới
            </h3>
            <p className="text-[11px] text-slate-400">
              Hỗ trợ định dạng Markdown, tổ chức thẻ phân loại và ghim linh hoạt
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
              title="Chọn màu nhận diện cho ghi chú"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shadow-xs flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[11px] text-slate-600 dark:text-slate-300 hidden sm:inline">Màu thẻ</span>
            </button>
            {isColorPickerOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50">
                <ColorPickerPopover
                  currentColor={color}
                  tagName={title || 'ghi-chu'}
                  onSelectColor={(c) => {
                    setColor(c);
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
            aria-label="Đóng soạn thảo ghi chú"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Form Content: 1 column on Mobile/Tablet, 2 columns on Laptop/Desktop */}
      <form onSubmit={handleCreateNote} className="space-y-4 text-xs mt-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Metadata & Controls (Title, Tags, Pin, Tips, Actions) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Tiêu đề ghi chú <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Kế hoạch tuần tới, Ý tưởng dự án..."
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
                  selectedTags={tags}
                  onChange={setTags}
                  placeholder="Chọn hoặc nhập thẻ mới..."
                />
              </div>

              {/* Pin toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5">
                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-brand fill-current' : 'text-slate-400'}`} />
                    <span>Ghim ghi chú lên đầu trang</span>
                  </span>
                </label>
                {isPinned && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-brand/10 text-brand font-bold">
                    Đang ghim
                  </span>
                )}
              </div>

              {/* Desktop Markdown Quick Helper & Stats */}
              <div className="hidden lg:block p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="font-semibold flex items-center gap-1 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-brand" />
                    <span>Thống kê & Mẹo Markdown</span>
                  </span>
                  <span className="text-[10px]">
                    {wordCount} từ · {charCount} ký tự
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div><code className="text-brand"># Tiêu đề 1</code></div>
                  <div><code className="text-brand">**chữ đậm**</code></div>
                  <div><code className="text-brand">- [ ] Việc cần làm</code></div>
                  <div><code className="text-brand">*chữ nghiêng*</code></div>
                  <div><code className="text-brand">```mã code```</code></div>
                  <div><code className="text-brand">&gt; Trích dẫn</code></div>
                </div>
              </div>
            </div>

            {/* Desktop Action Buttons (Pinned at bottom of left column on LG) */}
            <div className="hidden lg:flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Lưu Ghi Chú</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Markdown Editor Workspace */}
          <div className="lg:col-span-7 flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold block text-slate-700 dark:text-slate-300">
                Nội dung ghi chú (Markdown)
              </label>
              <span className="text-[10px] text-slate-400 lg:hidden">
                {wordCount} từ · {charCount} ký tự
              </span>
            </div>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Nhập nội dung ghi chú (hỗ trợ tiêu đề, danh sách, công việc, trích dẫn, khối code, bảng...)"
              minHeightClass="min-h-[200px] lg:min-h-[460px]"
              maxHeightPreviewClass="max-h-[350px] lg:max-h-[460px]"
            />
          </div>
        </div>

        {/* Mobile/Tablet Action Buttons (Shown below editor on screen < LG) */}
        <div className="lg:hidden pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
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
            className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Lưu Ghi Chú Vào CSDL</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
