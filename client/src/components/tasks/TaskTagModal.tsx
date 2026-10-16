import React, { useState } from 'react';
import { Tag, Edit3, Trash2, Check, X, Search, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { ColorPickerPopover } from '../common/ColorPickerPopover';
import { toast } from 'sonner';

export interface TaskTagItem {
  name: string;
  count: number;
  color?: string;
}

interface TaskTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: TaskTagItem[];
  onRenameTag: (oldTag: string, newTag: string) => Promise<void>;
  onDeleteTag: (tag: string) => Promise<void>;
  onChangeColor?: (tag: string, color: string) => Promise<void>;
}

export const TaskTagModal: React.FC<TaskTagModalProps> = ({
  isOpen,
  onClose,
  tags,
  onRenameTag,
  onDeleteTag,
  onChangeColor,
}) => {
  const [search, setSearch] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [colorPickerTag, setColorPickerTag] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleStartRename = (tag: string) => {
    setEditingTag(tag);
    setRenameValue(tag);
  };

  const handleSaveRename = async (oldTag: string) => {
    const cleanNew = renameValue.trim().toLowerCase().replace(/^#/, '');
    if (!cleanNew) {
      toast.error('Tên thẻ không được để trống.');
      return;
    }
    if (cleanNew === oldTag) {
      setEditingTag(null);
      return;
    }

    setIsSubmitting(true);
    try {
      await onRenameTag(oldTag, cleanNew);
      setEditingTag(null);
    } catch {
      // Error handled by caller toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return;
    setIsSubmitting(true);
    try {
      await onDeleteTag(tagToDelete);
      setTagToDelete(null);
    } catch {
      // Error handled by caller toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectColor = async (tag: string, color: string) => {
    setColorPickerTag(null);
    if (onChangeColor) {
      try {
        await onChangeColor(tag, color);
      } catch {
        // Handled by parent
      }
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        disableClose={isSubmitting}
        ariaLabelledBy="task-tag-modal-title"
        maxWidth="lg"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 id="task-tag-modal-title" className="font-bold text-base">Quản Lý Thẻ Công Việc</h3>
              <p className="text-[11px] text-slate-400">
                Đổi tên hoặc xóa thẻ phân loại trên toàn bộ danh sách công việc
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng quản lý thẻ"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search tags */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm thẻ trong hệ thống..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {/* Tags list */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar-y">
          {filteredTags.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              {tags.length === 0 ? 'Chưa có thẻ nào được tạo.' : 'Không tìm thấy thẻ nào khớp từ khóa.'}
            </div>
          ) : (
            filteredTags.map((item) => {
              const isEditing = editingTag === item.name;
              return (
                <div
                  key={item.name}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 hover:border-brand/30 transition-all"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-slate-400 font-bold">#</span>
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(item.name);
                          if (e.key === 'Escape') setEditingTag(null);
                        }}
                        autoFocus
                        disabled={isSubmitting}
                        className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-brand bg-white dark:bg-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(item.name)}
                        disabled={isSubmitting}
                        className="p-1.5 rounded-lg bg-brand text-white hover:bg-brand-hover cursor-pointer"
                        title="Lưu"
                      >
                        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTag(null)}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 cursor-pointer"
                        title="Hủy"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Color Picker Swatch */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setColorPickerTag(colorPickerTag === item.name ? null : item.name)}
                            className="w-5 h-5 rounded-full border border-black/10 dark:border-white/20 shadow-xs cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                            style={{ backgroundColor: item.color || '#6366F1' }}
                            title="Đổi màu thẻ"
                          />
                          {colorPickerTag === item.name && (
                            <div className="absolute left-0 top-full mt-1.5 z-50">
                              <ColorPickerPopover
                                currentColor={item.color || '#6366F1'}
                                tagName={item.name}
                                onSelectColor={(color) => handleSelectColor(item.name, color)}
                                onClose={() => setColorPickerTag(null)}
                              />
                            </div>
                          )}
                        </div>

                        {/* Tag Badge */}
                        <span
                          className="font-semibold text-xs px-2.5 py-1 rounded-lg border truncate"
                          style={{
                            backgroundColor: `${item.color || '#6366F1'}15`,
                            borderColor: `${item.color || '#6366F1'}35`,
                            color: item.color || '#6366F1',
                          }}
                        >
                          #{item.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex-shrink-0">
                          {item.count} công việc
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setColorPickerTag(colorPickerTag === item.name ? null : item.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                          title="Đổi màu thẻ"
                        >
                          <div className="w-3.5 h-3.5 rounded-full border border-current" style={{ backgroundColor: item.color || '#6366F1' }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartRename(item.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                          title="Đổi tên thẻ"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTagToDelete(item.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Xóa thẻ khỏi tất cả công việc"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </Modal>

      {/* Confirm Delete Tag Modal */}
      <ConfirmModal
        isOpen={Boolean(tagToDelete)}
        isLoading={isSubmitting}
        onClose={() => setTagToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Xác Nhận Xóa Thẻ #${tagToDelete}?`}
        description="Thẻ này sẽ được gỡ khỏi tất cả các công việc liên quan. Bản thân các công việc vẫn được giữ nguyên vẹn."
        confirmText="Xóa Thẻ"
        cancelText="Giữ Lại"
        variant="danger"
      />
    </>
  );
};
