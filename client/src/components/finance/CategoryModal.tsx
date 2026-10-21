import React, { useState, useEffect } from 'react';
import { FolderTree, X, Plus, Edit3, Trash2, Check } from 'lucide-react';
import { CategoryItem, TransactionItem } from './types';
import { apiClient } from '../../api/client';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { CustomSelect } from '../common/CustomSelect';
import { InfoTooltip } from '../common/Tooltip';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  transactions: TransactionItem[];
  onCategoryCreated: (cat: CategoryItem) => void;
  onCategoryUpdated: (cat: CategoryItem, oldName: string) => void;
  onRequestDeleteCategory: (cat: CategoryItem) => void;
}

const CATEGORY_COLORS = [
  '#F97316',
  '#EC4899',
  '#3B82F6',
  '#EF4444',
  '#8B5CF6',
  '#10B981',
  '#06B6D4',
  '#6366F1',
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  transactions,
  onCategoryCreated,
  onCategoryUpdated,
  onRequestDeleteCategory,
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryType, setEditCategoryType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [editCategoryColor, setEditCategoryColor] = useState('#6366F1');

  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [newCatColor, setNewCatColor] = useState('#6366F1');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmittingCat) {
        onClose();
        setEditingCategoryId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmittingCat, onClose]);

  if (!isOpen) return null;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error('Vui lòng nhập tên danh mục.');
      return;
    }
    setIsSubmittingCat(true);
    const tempId = `cat-${Date.now()}`;
    const newCategory: CategoryItem = {
      id: tempId,
      name: newCatName.trim(),
      type: newCatType,
      color: newCatColor,
    };

    onCategoryCreated(newCategory);
    setNewCatName('');
    toast.success(`Đã thêm danh mục "${newCategory.name}" thành công!`);

    try {
      const res = await apiClient.post('/finance/categories', {
        name: newCategory.name,
        type: newCategory.type,
        color: newCategory.color,
      });
      if (res.data.data?.id) {
        onCategoryUpdated(
          { ...newCategory, id: res.data.data.id },
          newCategory.name
        );
      }
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch {
      // Degrade gracefully
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleStartEditCategory = (cat: CategoryItem) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
    setEditCategoryType(cat.type as 'INCOME' | 'EXPENSE');
    setEditCategoryColor(cat.color || '#6366F1');
  };

  const handleSaveEditCategory = async (catId: string) => {
    if (!editCategoryName.trim()) {
      toast.error('Tên danh mục không được để trống.');
      return;
    }
    const oldCat = categories.find((c) => c.id === catId);
    const oldName = oldCat?.name || '';
    const newName = editCategoryName.trim();

    const updatedCat: CategoryItem = {
      id: catId,
      name: newName,
      type: editCategoryType,
      color: editCategoryColor,
    };

    onCategoryUpdated(updatedCat, oldName);
    setEditingCategoryId(null);
    toast.success(`Đã cập nhật danh mục "${newName}"!`);

    try {
      await apiClient.patch(`/finance/categories/${catId}`, {
        name: newName,
        type: editCategoryType,
        color: editCategoryColor,
      });
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch {
      // Degrade gracefully
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setEditingCategoryId(null);
      }}
      disableClose={isSubmittingCat}
      ariaLabelledBy="category-modal-title"
      maxWidth="lg"
    >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <h3 id="category-modal-title" className="font-bold text-base">Quản Lý Danh Mục Thu Chi</h3>
              <p className="text-[11px] text-slate-400">
                Tùy chỉnh các danh mục tài chính để phân loại giao dịch chính xác
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              setEditingCategoryId(null);
            }}
            aria-label="Đóng quản lý danh mục"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Add New Category */}
        <form
          onSubmit={handleCreateCategory}
          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-3 text-xs"
        >
          <div className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-brand" />
            <span>Thêm danh mục mới</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold block mb-1">Tên danh mục</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="VD: Giáo dục, Thú cưng..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="font-semibold block text-slate-700 dark:text-slate-300">Loại danh mục</label>
                <InfoTooltip content="Phân loại danh mục này là Khoản chi tiêu (-) hay Khoản thu nhập (+)." />
              </div>
              <CustomSelect
                value={newCatType}
                onChange={(val) => setNewCatType(val as 'EXPENSE' | 'INCOME')}
                size="sm"
                options={[
                  { value: 'EXPENSE', label: 'Khoản chi (-)', color: '#EF4444' },
                  { value: 'INCOME', label: 'Khoản thu (+)', color: '#10B981' },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Màu:</span>
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCatColor(c)}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                    newCatColor === c ? 'scale-125 ring-2 ring-brand ring-offset-1' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmittingCat || !newCatName.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
            >
              + Thêm
            </button>
          </div>
        </form>

        {/* Existing Categories List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>Danh sách hiện có ({categories.length})</span>
            <span className="text-[11px] font-normal text-slate-400">Nhấp để chỉnh sửa hoặc xóa</span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {categories.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                Chưa có danh mục nào. Hãy tạo danh mục đầu tiên ở biểu mẫu phía trên!
              </div>
            ) : (
              categories.map((cat) => {
              const isEditing = editingCategoryId === cat.id;
              const txCount = transactions.filter((tx) => tx.category === cat.name).length;

              return (
                <div
                  key={cat.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  {isEditing ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-brand bg-white dark:bg-slate-900 text-xs flex-1"
                        placeholder="Tên danh mục..."
                        autoFocus
                      />
                      <CustomSelect
                        value={editCategoryType}
                        onChange={(val) => setEditCategoryType(val as 'EXPENSE' | 'INCOME')}
                        size="sm"
                        className="w-32 flex-shrink-0"
                        options={[
                          { value: 'EXPENSE', label: 'Chi (-)', color: '#EF4444' },
                          { value: 'INCOME', label: 'Thu (+)', color: '#10B981' },
                        ]}
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEditCategory(cat.id)}
                          className="p-1.5 rounded-lg bg-brand text-white hover:bg-brand-hover cursor-pointer"
                          title="Lưu thay đổi"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategoryId(null)}
                          className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 cursor-pointer"
                          title="Hủy"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color || '#6366F1' }}
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {cat.name}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold flex-shrink-0 ${
                            cat.type === 'INCOME'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {cat.type === 'INCOME' ? 'Khoản thu' : 'Khoản chi'}
                        </span>
                        {txCount > 0 && (
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            ({txCount} GD)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                          title="Đổi tên danh mục"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteCategory(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Xóa danh mục"
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
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => {
              onClose();
              setEditingCategoryId(null);
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
          >
            Hoàn Tất
          </button>
        </div>
    </Modal>
  );
};
