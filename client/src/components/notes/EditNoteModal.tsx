import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Edit3, X, Check, Pin, Loader2, Sparkles, RefreshCw, AlertCircle, Cloud } from 'lucide-react';
import { apiClient, getErrorMessage } from '../../api/client';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { TagSelect } from './TagSelect';
import { MarkdownEditor } from './MarkdownEditor';
import { ColorPickerPopover } from '../common/ColorPickerPopover';
import { useAutoSave } from '../../hooks/useAutoSave';

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
  onSuccess?: (updatedNote?: any) => void;
  onNoteSaved?: (updatedNote: any) => void;
}

export const EditNoteModal: React.FC<EditNoteModalProps> = ({
  isOpen,
  onClose,
  note,
  availableTags,
  onSuccess,
  onNoteSaved,
}) => {
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editColor, setEditColor] = useState('#6366F1');
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const hasEverSavedRef = useRef<boolean>(false);

  // Group current form values for auto-save monitoring
  const formData = useMemo(() => ({
    title: editTitle.trim(),
    content: editContent.trim(),
    tags: editTags.length > 0 ? editTags : ['chung'],
    color: editColor,
    isPinned: editIsPinned,
  }), [editTitle, editContent, editTags, editColor, editIsPinned]);

  // Execute PATCH request
  const handleSavePatch = useCallback(async (dataToSave: typeof formData) => {
    if (!note?.id) return;
    try {
      const res = await apiClient.patch(`/notes/${note.id}`, dataToSave);
      const updated = res.data?.data;
      hasEverSavedRef.current = true;
      if (updated) {
        onSuccess?.(updated);
        onNoteSaved?.(updated);
      }
      return updated;
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể tự động lưu ghi chú.'));
      throw err;
    }
  }, [note?.id, onSuccess, onNoteSaved]);

  // Enterprise Auto-Save hook with Debounce, MaxWait, Dirty Check, Flush on Exit
  const {
    status,
    isDirty,
    flush,
    retry,
    saveNow,
    resetToInitial,
  } = useAutoSave({
    data: formData,
    onSave: handleSavePatch,
    debounceMs: 1000,
    maxWaitMs: 4000,
    validate: (d) => Boolean(d.title.trim()),
    enabled: isOpen && Boolean(note),
  });

  // Sync state when modal opens with a note
  useEffect(() => {
    if (isOpen && note) {
      const initialTitle = note.title || '';
      const initialContent = note.content || '';
      const initialTags = Array.isArray(note.tags) ? [...note.tags] : [];
      const initialColor = note.color || '#6366F1';
      const initialPinned = Boolean(note.isPinned);

      setEditTitle(initialTitle);
      setEditContent(initialContent);
      setEditTags(initialTags);
      setEditColor(initialColor);
      setEditIsPinned(initialPinned);
      setIsColorPickerOpen(false);
      hasEverSavedRef.current = false;

      resetToInitial({
        title: initialTitle.trim(),
        content: initialContent.trim(),
        tags: initialTags.length > 0 ? initialTags : ['chung'],
        color: initialColor,
        isPinned: initialPinned,
      });
    }
  }, [isOpen, note, resetToInitial]);

  // Safe close: flush any pending changes before closing modal
  const handleSafeClose = useCallback(async () => {
    if (isDirty) {
      await flush();
    }
    if (hasEverSavedRef.current) {
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    }
    onClose();
  }, [isDirty, flush, onClose]);

  // Keyboard accessibility: Close/Flush on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSafeClose]);

  if (!isOpen || !note) return null;

  const wordCount = editContent.trim() ? editContent.trim().split(/\s+/).length : 0;
  const charCount = editContent.length;

  // Render the dynamic Status Button
  const renderStatusButton = () => {
    switch (status) {
      case 'saved':
        return (
          <button
            type="button"
            disabled
            className="flex-1 py-2.5 px-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-default select-none transition-all shadow-2xs"
            title="Tất cả thay đổi đã được tự động lưu lên máy chủ"
          >
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>Đã lưu thay đổi</span>
          </button>
        );

      case 'pending':
        return (
          <button
            type="button"
            onClick={saveNow}
            className="flex-1 py-2.5 px-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs group"
            title="Nhấn để lưu ngay lập tức (hoặc tự động lưu sau 1 giây)"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="group-hover:hidden">Có thay đổi...</span>
            <span className="hidden group-hover:inline">Lưu ngay</span>
          </button>
        );

      case 'saving':
        return (
          <button
            type="button"
            disabled
            className="flex-1 py-2.5 px-3.5 rounded-xl bg-brand/10 dark:bg-brand/20 border border-brand/30 text-brand font-semibold text-xs flex items-center justify-center gap-1.5 cursor-wait select-none transition-all shadow-2xs"
            title="Đang đồng bộ thay đổi lên máy chủ..."
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
            <span>Đang lưu...</span>
          </button>
        );

      case 'error':
        return (
          <button
            type="button"
            onClick={retry}
            className="flex-1 py-2.5 px-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            title="Gặp sự cố khi lưu. Nhấn để thử lại ngay"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
            <span>Lỗi lưu. Nhấp để thử lại</span>
          </button>
        );

      case 'invalid':
      default:
        return (
          <button
            type="button"
            disabled
            className="flex-1 py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed select-none transition-all"
            title="Tiêu đề ghi chú không được để trống"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Cần có tiêu đề</span>
          </button>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSafeClose}
      ariaLabelledBy="edit-note-modal-title"
      maxWidth="max-w-lg lg:max-w-5xl xl:max-w-6xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center font-bold text-white shadow-xs transition-colors"
            style={{ backgroundColor: editColor }}
          >
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h3 id="edit-note-modal-title" className="font-bold text-base text-slate-900 dark:text-slate-100">
              Chỉnh Sửa Ghi Chú
            </h3>
            <p className="text-[11px] text-slate-400">
              Tự động lưu ngầm chuẩn doanh nghiệp khi bạn chỉnh sửa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Header Sync Chip */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-[11px] select-none">
            {status === 'saving' ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-brand" />
                <span className="text-brand font-medium">Đang lưu...</span>
              </>
            ) : status === 'pending' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-600 dark:text-amber-400">Có sửa đổi</span>
              </>
            ) : status === 'error' ? (
              <>
                <AlertCircle className="w-3 h-3 text-rose-500" />
                <span className="text-rose-500 font-medium">Lỗi lưu</span>
              </>
            ) : (
              <>
                <Cloud className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Tự động lưu</span>
              </>
            )}
          </div>

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
              <span className="text-[11px] text-slate-600 dark:text-slate-300 hidden sm:inline">Đổi màu</span>
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
            onClick={handleSafeClose}
            aria-label="Đóng chỉnh sửa ghi chú"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); flush(); }} className="space-y-4 text-xs mt-3">
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
                onClick={handleSafeClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
              {renderStatusButton()}
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
              value={editContent}
              onChange={setEditContent}
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
            onClick={handleSafeClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
          {renderStatusButton()}
        </div>
      </form>
    </Modal>
  );
};
