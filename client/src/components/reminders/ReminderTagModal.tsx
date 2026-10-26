import React, { useState } from 'react';
import { Tag, Edit3, Trash2, Check, X, Search } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { ColorPickerPopover } from '../common/ColorPickerPopover';
import { toast } from 'sonner';

export interface ReminderTagItem {
  name: string;
  count: number;
  color?: string;
}

interface ReminderTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: ReminderTagItem[];
  onRenameTag: (oldTag: string, newTag: string) => Promise<void>;
  onDeleteTag: (tag: string) => Promise<void>;
  onChangeColor?: (tag: string, color: string) => Promise<void>;
}

export const ReminderTagModal: React.FC<ReminderTagModalProps> = ({
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
      // Error handled by caller
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
      // Error handled by caller
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
        // Handled by caller
      }
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        disableClose={isSubmitting}
        ariaLabelledBy="reminder-tag-modal-title"
        maxWidth="lg"
      >
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 id="reminder-tag-modal-title" className="font-bold text-base text-slate-900 dark:text-white">
                  Quản Lý Thẻ Nhắc Hẹn
                </h3>
                <p className="text-[11px] text-slate-400">
                  Đổi tên, chọn màu sắc và phân loại lịch trình
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Đóng quản lý thẻ"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm thẻ nhắc hẹn..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* Tag List */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredTags.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                {search ? 'Không tìm thấy thẻ phù hợp' : 'Chưa có thẻ nào được tạo trong mục Nhắc hẹn'}
              </div>
            ) : (
              filteredTags.map((t) => {
                const isEditingThis = editingTag === t.name;
                const tagColor = t.color || '#6366F1';

                return (
                  <div
                    key={t.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                      {/* Color Picker Indicator */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setColorPickerTag(colorPickerTag === t.name ? null : t.name)
                          }
                          title="Đổi màu thẻ"
                          className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm transition-transform hover:scale-125 cursor-pointer shrink-0"
                          style={{ backgroundColor: tagColor }}
                        />
                        {colorPickerTag === t.name && (
                          <ColorPickerPopover
                            currentColor={tagColor}
                            onSelectColor={(color) => handleSelectColor(t.name, color)}
                            onClose={() => setColorPickerTag(null)}
                          />
                        )}
                      </div>

                      {/* Name or Rename Input */}
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(t.name);
                              if (e.key === 'Escape') setEditingTag(null);
                            }}
                            autoFocus
                            className="flex-1 px-2 py-1 text-xs rounded-lg border border-brand bg-white dark:bg-slate-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(t.name)}
                            disabled={isSubmitting}
                            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTag(null)}
                            disabled={isSubmitting}
                            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className="text-xs font-bold truncate text-slate-800 dark:text-slate-200"
                            style={{ color: tagColor }}
                          >
                            #{t.name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            ({t.count} nhắc hẹn)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!isEditingThis && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartRename(t.name)}
                          disabled={isSubmitting}
                          title="Đổi tên thẻ"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTagToDelete(t.name)}
                          disabled={isSubmitting}
                          title="Xóa thẻ khỏi tất cả nhắc hẹn"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(tagToDelete)}
        onClose={() => setTagToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Xóa thẻ nhắc hẹn"
        description={`Bạn có chắc chắn muốn xóa thẻ "#${tagToDelete}" khỏi tất cả nhắc hẹn liên quan?`}
        confirmText="Xác Nhận Xóa"
        isLoading={isSubmitting}
      />
    </>
  );
};
