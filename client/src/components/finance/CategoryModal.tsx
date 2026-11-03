import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FolderTree,
  X,
  Plus,
  Edit3,
  Trash2,
  Check,
  Tag,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { CategoryItem, TransactionItem } from './types';
import { apiClient } from '../../api/client';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { CustomSelect } from '../common/CustomSelect';
import { Tooltip, InfoTooltip } from '../common/Tooltip';
import { SearchInput } from '../common/SearchInput';
import { PaginationControl, PaginationMeta } from '../common/PaginationControl';
import { EmptySearch } from '../illustrations';
import { matchesSearch } from '../../lib/searchUtils';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  transactions: TransactionItem[];
  onCategoryCreated: (cat: CategoryItem) => void;
  onCategoryUpdated: (cat: CategoryItem, oldName: string) => void;
  onRequestDeleteCategory: (cat: CategoryItem) => void;
}

// 16 curated high-contrast colors matching the Flux theme
const CATEGORY_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#84CC16', // Lime
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#E11D48', // Rose
  '#D97706', // Yellow-Orange
  '#7C3AED', // Deep Violet
  '#64748B', // Slate
];

type CategoryTypeFilter = 'ALL' | 'EXPENSE' | 'INCOME';
type CategorySortOption = 'NEWEST' | 'NAME_ASC' | 'TX_COUNT';

const ITEMS_PER_PAGE = 12;

/**
 * Memoized individual category card to prevent re-rendering all items
 * when searching, paginating, or editing an unrelated category.
 */
interface CategoryCardProps {
  category: CategoryItem;
  txCount: number;
  isEditing: boolean;
  editName: string;
  editType: 'INCOME' | 'EXPENSE';
  editColor: string;
  onStartEdit: (cat: CategoryItem) => void;
  onCancelEdit: () => void;
  onSaveEdit: (catId: string) => void;
  onRequestDelete: (cat: CategoryItem) => void;
  onChangeEditName: (name: string) => void;
  onChangeEditType: (type: 'INCOME' | 'EXPENSE') => void;
  onChangeEditColor: (color: string) => void;
}

const CategoryCard = React.memo<CategoryCardProps>(({
  category,
  txCount,
  isEditing,
  editName,
  editType,
  editColor,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRequestDelete,
  onChangeEditName,
  onChangeEditType,
  onChangeEditColor,
}) => {
  const isIncome = category.type === 'INCOME';

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg bg-card border border-border shadow-xs space-y-3 transition-[border-color] col-span-1 sm:col-span-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Chỉnh sửa danh mục</span>
          </span>
          <div className="flex items-center gap-1">
            <Tooltip content="Lưu thay đổi (Enter)">
              <button
                type="button"
                onClick={() => onSaveEdit(category.id)}
                className="p-1 rounded-md bg-foreground text-background hover:opacity-90 transition-[opacity] cursor-pointer"
                aria-label="Lưu thay đổi"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip content="Hủy bỏ (Esc)">
              <button
                type="button"
                onClick={onCancelEdit}
                className="p-1 rounded-md border border-border bg-secondary hover:bg-muted text-foreground transition-[background-color] cursor-pointer"
                aria-label="Hủy chỉnh sửa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input
            type="text"
            value={editName}
            onChange={(e) => onChangeEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSaveEdit(category.id);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancelEdit();
              }
            }}
            placeholder="Tên danh mục…"
            autoFocus
            className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-xs font-medium focus-ring"
          />

          <CustomSelect
            value={editType}
            onChange={(val) => onChangeEditType(val as 'INCOME' | 'EXPENSE')}
            size="sm"
            options={[
              { value: 'EXPENSE', label: 'Khoản chi (-)', color: '#EF4444' },
              { value: 'INCOME', label: 'Khoản thu (+)', color: '#10B981' },
            ]}
          />
        </div>

        {/* Color Palette Selector */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40">
          <span className="text-[11px] text-muted-foreground font-medium mr-1">Màu sắc:</span>
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChangeEditColor(color)}
              className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                editColor === color
                  ? 'scale-125 ring-2 ring-foreground ring-offset-2'
                  : 'opacity-70 hover:opacity-100 hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-2.5 rounded-md bg-card border border-border hover:border-foreground/30 transition-[border-color] flex items-center justify-between gap-2.5 text-xs group">
      {/* Category Info */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: category.color || 'hsl(var(--foreground))' }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="font-medium text-foreground truncate"
              title={category.name}
            >
              {category.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-medium flex-shrink-0 ${
                isIncome
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
              }`}
            >
              {isIncome ? 'Thu' : 'Chi'}
            </span>
            <Tooltip content={`Đang có ${txCount} giao dịch thuộc danh mục này`}>
              <span className="text-[10px] text-muted-foreground tabular-nums font-medium">
                {txCount} GD
              </span>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        <Tooltip content="Chỉnh sửa danh mục">
          <button
            type="button"
            onClick={() => onStartEdit(category)}
            aria-label={`Chỉnh sửa danh mục ${category.name}`}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-[color,background-color] cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip content="Xóa danh mục này">
          <button
            type="button"
            onClick={() => onRequestDelete(category)}
            aria-label={`Xóa danh mục ${category.name}`}
            className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-[color,background-color] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
});

CategoryCard.displayName = 'CategoryCard';

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  transactions,
  onCategoryCreated,
  onCategoryUpdated,
  onRequestDeleteCategory,
}) => {
  // Navigation & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CategoryTypeFilter>('ALL');
  const [sortOption, setSortOption] = useState<CategorySortOption>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);

  // Create Category Accordion Drawer State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [newCatColor, setNewCatColor] = useState('#6366F1');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Edit Category State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryType, setEditCategoryType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [editCategoryColor, setEditCategoryColor] = useState('#6366F1');

  // Automatically open create drawer if user has 0 categories
  useEffect(() => {
    if (categories.length === 0) {
      setIsCreateOpen(true);
    }
  }, [categories.length]);

  // Reset page when filter, sort, or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, sortOption]);

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmittingCat) {
        if (editingCategoryId) {
          setEditingCategoryId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmittingCat, editingCategoryId, onClose]);

  // 1. Precalculate transaction count map once in O(T) instead of O(C * T) per render
  const txCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < transactions.length; i++) {
      const cat = transactions[i].category;
      if (cat) {
        map[cat] = (map[cat] || 0) + 1;
      }
    }
    return map;
  }, [transactions]);

  // 2. Aggregate statistics for headers & tabs
  const { incomeCount, expenseCount } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (let i = 0; i < categories.length; i++) {
      if (categories[i].type === 'INCOME') income++;
      else expense++;
    }
    return { incomeCount: income, expenseCount: expense };
  }, [categories]);

  // 3. Filter & Sort Categories
  const filteredAndSortedCategories = useMemo(() => {
    let result = categories;

    // Filter by type
    if (typeFilter !== 'ALL') {
      result = result.filter((cat) => cat.type === typeFilter);
    }

    // Filter by search query (Vietnamese tone-insensitive)
    if (searchQuery.trim()) {
      result = result.filter((cat) => matchesSearch(cat.name, searchQuery));
    }

    // Sort
    if (sortOption === 'NAME_ASC') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } else if (sortOption === 'TX_COUNT') {
      result = [...result].sort((a, b) => (txCountMap[b.name] || 0) - (txCountMap[a.name] || 0));
    }

    return result;
  }, [categories, typeFilter, searchQuery, sortOption, txCountMap]);

  // 4. Pagination
  const totalItems = filteredAndSortedCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedCategories, currentPage]);

  const paginationMeta: PaginationMeta = useMemo(() => ({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    total: totalItems,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  }), [currentPage, totalItems, totalPages]);

  // Handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (!cleanName) {
      toast.error('Vui lòng nhập tên danh mục.');
      return;
    }

    // Prevent duplicate category names in same type
    const exists = categories.some(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase() && c.type === newCatType
    );
    if (exists) {
      toast.error(`Danh mục "${cleanName}" (${newCatType === 'INCOME' ? 'Thu' : 'Chi'}) đã tồn tại.`);
      return;
    }

    setIsSubmittingCat(true);
    const tempId = `cat-${Date.now()}`;
    const newCategory: CategoryItem = {
      id: tempId,
      name: cleanName,
      type: newCatType,
      color: newCatColor,
    };

    onCategoryCreated(newCategory);
    setNewCatName('');
    setIsCreateOpen(false);
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
      // Degrade gracefully - UI remains optimistic
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleStartEditCategory = useCallback((cat: CategoryItem) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
    setEditCategoryType(cat.type as 'INCOME' | 'EXPENSE');
    setEditCategoryColor(cat.color || '#6366F1');
  }, []);

  const handleCancelEditCategory = useCallback(() => {
    setEditingCategoryId(null);
  }, []);

  const handleSaveEditCategory = useCallback(async (catId: string) => {
    const cleanName = editCategoryName.trim();
    if (!cleanName) {
      toast.error('Tên danh mục không được để trống.');
      return;
    }

    const oldCat = categories.find((c) => c.id === catId);
    const oldName = oldCat?.name || '';

    const updatedCat: CategoryItem = {
      id: catId,
      name: cleanName,
      type: editCategoryType,
      color: editCategoryColor,
    };

    onCategoryUpdated(updatedCat, oldName);
    setEditingCategoryId(null);
    toast.success(`Đã cập nhật danh mục "${cleanName}"!`);

    try {
      await apiClient.patch(`/finance/categories/${catId}`, {
        name: cleanName,
        type: editCategoryType,
        color: editCategoryColor,
      });
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch {
      // Degrade gracefully
    }
  }, [categories, editCategoryName, editCategoryType, editCategoryColor, onCategoryUpdated]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setSortOption('NEWEST');
  }, []);

  if (!isOpen) return null;

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
      <div className="space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md border border-border bg-muted text-foreground flex items-center justify-center font-bold">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="category-modal-title" className="font-semibold text-base text-foreground">
                  Quản Lý Danh Mục Thu Chi
                </h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground tabular-nums">
                  {categories.length}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tùy chỉnh phân loại tài chính ({incomeCount} Thu · {expenseCount} Chi)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip content={isCreateOpen ? 'Thu gọn form tạo' : 'Mở form thêm danh mục mới'}>
              <button
                type="button"
                onClick={() => setIsCreateOpen((prev) => !prev)}
                className={`px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition-[opacity,transform] cursor-pointer ${
                  isCreateOpen
                    ? 'border border-border bg-secondary text-foreground hover:bg-muted'
                    : 'bg-foreground text-background hover:opacity-90 active:scale-[0.98]'
                }`}
              >
                <Plus className={`w-3.5 h-3.5 transition-transform ${isCreateOpen ? 'rotate-45' : ''}`} />
                <span>{isCreateOpen ? 'Đóng' : 'Thêm mới'}</span>
              </button>
            </Tooltip>

            <Tooltip content="Đóng quản lý danh mục (Esc)">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setEditingCategoryId(null);
                }}
                aria-label="Đóng quản lý danh mục"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-[background-color] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Collapsible Create New Category Form */}
        {isCreateOpen && (
          <form
            onSubmit={handleCreateCategory}
            className="p-3.5 rounded-lg bg-card border border-border space-y-3 text-xs"
          >
            <div className="font-medium text-xs text-foreground flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Tạo danh mục mới</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-normal">
                Điền tên và chọn màu đại diện
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-medium block mb-1 text-foreground">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="VD: Giáo dục, Thú cưng, Cà phê…"
                  autoFocus
                  className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-xs font-medium focus-ring"
                />
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="font-medium block text-foreground">
                    Phân loại
                  </label>
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

            {/* Color Palette Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-medium mr-1">
                  Màu đại diện:
                </span>
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                      newCatColor === c
                        ? 'scale-125 ring-2 ring-foreground ring-offset-2'
                        : 'opacity-70 hover:opacity-100 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-border bg-secondary hover:bg-muted text-foreground font-medium text-xs transition-[background-color] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCat || !newCatName.trim()}
                  className="px-3.5 py-1.5 rounded-md bg-foreground text-background font-medium text-xs hover:opacity-90 active:scale-[0.98] transition-[opacity,transform] disabled:opacity-50 cursor-pointer flex-shrink-0"
                >
                  {isSubmittingCat ? 'Đang thêm…' : '+ Tạo danh mục'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Toolbar: Search, Type Tabs & Sort Selector */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input with Esc clear & instant response */}
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm nhanh danh mục theo tên…"
              className="flex-1"
              ariaLabel="Tìm kiếm danh mục"
            />

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Tooltip content="Sắp xếp danh mục">
                <CustomSelect
                  value={sortOption}
                  onChange={(val) => setSortOption(val as CategorySortOption)}
                  size="sm"
                  icon={<ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  className="w-44"
                  options={[
                    { value: 'NEWEST', label: 'Mới nhất' },
                    { value: 'NAME_ASC', label: 'Tên (A → Z)' },
                    { value: 'TX_COUNT', label: 'Giao dịch (Nhiều)' },
                  ]}
                />
              </Tooltip>
            </div>
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-border/40 bg-muted text-xs font-medium">
              <button
                type="button"
                onClick={() => setTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded-sm transition-[color,background-color] cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === 'ALL'
                    ? 'bg-background text-foreground shadow-xs font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Tất Cả</span>
                <span className="text-[10px] opacity-70">({categories.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTypeFilter('EXPENSE')}
                className={`px-2.5 py-1 rounded-sm transition-[color,background-color] cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === 'EXPENSE'
                    ? 'bg-background text-rose-500 shadow-xs font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Khoản Chi</span>
                <span className="text-[10px] opacity-70">({expenseCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setTypeFilter('INCOME')}
                className={`px-2.5 py-1 rounded-sm transition-[color,background-color] cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === 'INCOME'
                    ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-xs font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Khoản Thu</span>
                <span className="text-[10px] opacity-70">({incomeCount})</span>
              </button>
            </div>

            <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
              Đang hiển thị {filteredAndSortedCategories.length} / {categories.length}
            </span>
          </div>
        </div>

        {/* Existing Categories 2-Column Responsive Grid */}
        <div className="max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
          {categories.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg space-y-2">
              <FolderTree className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="font-semibold text-foreground">
                Chưa có danh mục nào trong hệ thống
              </p>
              <p className="text-[11px] text-muted-foreground">
                Bấm vào nút &quot;Thêm mới&quot; phía trên để tạo danh mục thu chi đầu tiên của bạn!
              </p>
            </div>
          ) : filteredAndSortedCategories.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg space-y-3">
              <EmptySearch width={120} height={95} />
              <div>
                <p className="font-semibold text-sm text-foreground">
                  Không tìm thấy danh mục nào
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Không có danh mục nào khớp với điều kiện lọc hoặc từ khóa &quot;{searchQuery}&quot;.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary hover:bg-muted text-foreground text-xs font-medium transition-[background-color] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa bộ lọc tìm kiếm</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {paginatedCategories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  txCount={txCountMap[cat.name] || 0}
                  isEditing={editingCategoryId === cat.id}
                  editName={editCategoryName}
                  editType={editCategoryType}
                  editColor={editCategoryColor}
                  onStartEdit={handleStartEditCategory}
                  onCancelEdit={handleCancelEditCategory}
                  onSaveEdit={handleSaveEditCategory}
                  onRequestDelete={onRequestDeleteCategory}
                  onChangeEditName={setEditCategoryName}
                  onChangeEditType={setEditCategoryType}
                  onChangeEditColor={setEditCategoryColor}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination Control (Appears when items exceed ITEMS_PER_PAGE) */}
        {totalItems > ITEMS_PER_PAGE && (
          <div className="pt-2 border-t border-border/60">
            <PaginationControl
              pagination={paginationMeta}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Danh mục giúp báo cáo dòng tiền và thói quen chi tiêu chính xác hơn.
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              setEditingCategoryId(null);
            }}
            className="px-3.5 py-1.5 rounded-md border border-border bg-secondary hover:bg-muted text-foreground font-medium text-xs transition-[background-color] cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};
