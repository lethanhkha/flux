import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Wallet,
  CheckSquare,
  FileText,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../api/client';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { TagSelect, TagOption } from '../notes/TagSelect';
import { MarkdownEditor } from '../notes/MarkdownEditor';
import { InfoTooltip } from '../common/Tooltip';
import { PRIORITY_TOOLTIPS } from '../../lib/taskUtils';

export interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'transaction' | 'task' | 'note';
}

interface WalletItem {
  id: string;
  name: string;
  balance: number;
  currency: string;
  isDefault?: boolean;
}

interface CategoryItem {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  color?: string;
  icon?: string;
}

const DEFAULT_SUGGESTED_TASK_TAGS = ['Dự án', 'Công việc', 'Học tập', 'Tài chính', 'Gia đình', 'Cá nhân'];

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'transaction',
}) => {
  const [activeTab, setActiveTab] = useState<'transaction' | 'task' | 'note'>(defaultTab);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. Transaction State ---
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [txWalletId, setTxWalletId] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txCustomCategory, setTxCustomCategory] = useState('');
  const [txNote, setTxNote] = useState('');

  // --- 2. Task State ---
  const [availableTaskTags, setAvailableTaskTags] = useState<TagOption[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [taskDueDate, setTaskDueDate] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [taskIsRecurring, setTaskIsRecurring] = useState(false);
  const [taskRecurrenceRule, setTaskRecurrenceRule] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [taskTags, setTaskTags] = useState<string[]>([]);

  // --- 3. Note State ---
  const [availableNoteTags, setAvailableNoteTags] = useState<TagOption[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>(['chung']);
  const [noteContent, setNoteContent] = useState('');

  // Synchronize defaultTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Load related data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Fetch wallets and categories
    Promise.all([
      apiClient.get('/finance/wallets').catch(() => null),
      apiClient.get('/finance/categories').catch(() => null),
      apiClient.get('/tasks/tags').catch(() => null),
      apiClient.get('/notes/tags').catch(() => null),
    ]).then(([walletsRes, categoriesRes, taskTagsRes, noteTagsRes]) => {
      // Wallets
      if (walletsRes?.data?.data && Array.isArray(walletsRes.data.data)) {
        const mappedWallets: WalletItem[] = walletsRes.data.data.map((w: any) => ({
          id: w.id,
          name: w.name,
          balance: parseFloat(w.currentBalance) || 0,
          currency: w.currency || 'VND',
          isDefault: Boolean(w.isDefault),
        }));
        setWallets(mappedWallets);
        if (!txWalletId || !mappedWallets.some((w) => w.id === txWalletId)) {
          const defWallet = mappedWallets.find((w) => w.isDefault) || mappedWallets[0];
          if (defWallet) setTxWalletId(defWallet.id);
        }
      }

      // Categories
      if (categoriesRes?.data?.data && Array.isArray(categoriesRes.data.data)) {
        setCategories(categoriesRes.data.data);
      }

      // Task tags
      if (taskTagsRes?.data?.data && Array.isArray(taskTagsRes.data.data)) {
        setAvailableTaskTags(taskTagsRes.data.data);
      }

      // Note tags
      if (noteTagsRes?.data?.data && Array.isArray(noteTagsRes.data.data)) {
        setAvailableNoteTags(noteTagsRes.data.data);
      }
    });
  }, [isOpen]);

  // Update default selected category when txType or categories change
  useEffect(() => {
    const validCats = categories.filter((c) => c.type === txType);
    if (validCats.length > 0 && !validCats.some((c) => c.name === txCategory)) {
      setTxCategory(validCats[0].name);
    } else if (validCats.length === 0) {
      setTxCategory('');
    }
  }, [txType, categories]);

  // Escape key close handler
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

  // --- Handlers ---
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ (> 0).');
      return;
    }

    const defaultWallet = wallets.find((w) => w.isDefault) || wallets[0];
    const activeWalletId = txWalletId || defaultWallet?.id;
    if (!activeWalletId) {
      toast.error('Chưa có thông tin ví để ghi nhận giao dịch.');
      return;
    }

    const targetWallet = wallets.find((w) => w.id === activeWalletId);
    if (txType === 'EXPENSE' && targetWallet && targetWallet.balance < amountNum) {
      toast.error(`Số dư ví "${targetWallet.name}" không đủ để chi tiêu.`);
      return;
    }

    const finalCategory = txCategory.trim() || txCustomCategory.trim();
    if (!finalCategory) {
      toast.error('Vui lòng chọn hoặc nhập danh mục giao dịch.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/finance/transactions', {
        walletId: activeWalletId,
        type: txType,
        amount: amountNum,
        category: finalCategory,
        note: txNote.trim() || undefined,
      });

      toast.success(
        txType === 'INCOME'
          ? `Đã ghi nhận khoản thu: +${formatCurrency(amountNum)}`
          : `Đã ghi nhận khoản chi: -${formatCurrency(amountNum)}`
      );

      // Reset and close
      setTxAmount('');
      setTxNote('');
      setTxCustomCategory('');
      onClose();
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể ghi nhận giao dịch.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề công việc.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/tasks', {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
        isRecurring: taskIsRecurring,
        recurrenceRule: taskIsRecurring ? taskRecurrenceRule : undefined,
        status: 'TODO',
        tags: taskTags,
      });

      toast.success('Đã thêm công việc mới vào danh sách to-do!');
      setTaskTitle('');
      setTaskDescription('');
      setTaskIsRecurring(false);
      setTaskTags([]);
      onClose();
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể tạo công việc mới.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề ghi chú.');
      return;
    }
    if (!noteContent.trim()) {
      toast.error('Vui lòng nhập nội dung ghi chú.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/notes', {
        title: noteTitle.trim(),
        content: noteContent.trim(),
        tags: noteTags.length > 0 ? noteTags : ['chung'],
      });

      toast.success('Đã lưu ghi chú mới vào kho tri thức!');
      setNoteTitle('');
      setNoteContent('');
      setNoteTags(['chung']);
      onClose();
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể lưu ghi chú.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === txType);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      disableClose={isSubmitting}
      ariaLabelledBy="quick-action-modal-title"
      maxWidth="lg"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h3 id="quick-action-modal-title" className="font-bold text-base leading-tight">
              Thao Tác Nhanh
            </h3>
            <p className="text-[11px] text-slate-400">
              Tạo mới giao dịch, công việc hoặc ghi chú vào không gian Flux
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Đóng thao tác nhanh"
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-center mt-3">
        <button
          type="button"
          onClick={() => setActiveTab('transaction')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'transaction'
              ? 'bg-white dark:bg-slate-900 text-brand shadow-sm font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Giao Dịch</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('task')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'task'
              ? 'bg-white dark:bg-slate-900 text-brand shadow-sm font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Công Việc</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('note')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'note'
              ? 'bg-white dark:bg-slate-900 text-brand shadow-sm font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Ghi Chú</span>
        </button>
      </div>

      {/* Tab 1: Giao Dịch (Matches AddTransactionModal) */}
      {activeTab === 'transaction' && (
        <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs mt-4">
          {/* Transaction Type Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTxType('EXPENSE')}
              className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                txType === 'EXPENSE'
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Khoản Chi Tiền (-)
            </button>
            <button
              type="button"
              onClick={() => setTxType('INCOME')}
              className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                txType === 'INCOME'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Khoản Thu Tiền (+)
            </button>
          </div>

          {/* Wallet Selector */}
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Chọn Ví
            </label>
            {wallets.length === 0 ? (
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400">
                Đang tải danh sách ví...
              </div>
            ) : (
              <select
                value={txWalletId || (wallets.find((w) => w.isDefault)?.id || wallets[0]?.id || '')}
                onChange={(e) => setTxWalletId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.isDefault ? ' (Mặc định)' : ''} ({formatCurrency(w.balance)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount Input (supports any amount e.g. 47857) */}
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Số tiền (VND)
            </label>
            <input
              type="number"
              required
              min="1"
              step="any"
              placeholder="VD: 47857"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base font-extrabold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Danh mục
            </label>
            {filteredCategories.length === 0 ? (
              <input
                type="text"
                required
                placeholder="Nhập danh mục: Ăn uống, Cafe, Mua sắm, Lương..."
                value={txCategory || txCustomCategory}
                onChange={(e) => {
                  setTxCategory(e.target.value);
                  setTxCustomCategory(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand font-medium"
              />
            ) : (
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Note Input */}
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Ghi chú (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="VD: Ăn tối với bạn, thanh toán hóa đơn..."
              value={txNote}
              onChange={(e) => setTxNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu Giao Dịch'}
          </button>
        </form>
      )}

      {/* Tab 2: Công Việc (Matches TasksPage Add Modal) */}
      {activeTab === 'task' && (
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs mt-4">
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Tiêu đề công việc
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="VD: Kiểm tra và nộp báo cáo thuế..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand font-medium"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Mô tả chi tiết (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Nhập ghi chú hoặc yêu cầu công việc..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Độ ưu tiên
                </label>
                <InfoTooltip content={PRIORITY_TOOLTIPS[taskPriority] || PRIORITY_TOOLTIPS.URGENT} />
              </div>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="URGENT">Khẩn cấp</option>
                <option value="HIGH">Ưu tiên cao</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="LOW">Thấp</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight line-clamp-2">
                {PRIORITY_TOOLTIPS[taskPriority]}
              </p>
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                Hạn chót
              </label>
              <input
                type="datetime-local"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          {/* Recurring Engine toggle */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={taskIsRecurring}
                onChange={(e) => setTaskIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <span>Lặp lại định kỳ (Recurring Engine)</span>
                <InfoTooltip content="Tự động tạo mới công việc cho chu kỳ tiếp theo ngay sau khi bạn đánh dấu hoàn thành." />
              </span>
            </label>
            {taskIsRecurring && (
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((rule) => (
                  <button
                    key={rule}
                    type="button"
                    onClick={() => setTaskRecurrenceRule(rule)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      taskRecurrenceRule === rule
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
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

          {/* Tags using TagSelect */}
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Gắn thẻ phân loại (Tags)
            </label>
            <TagSelect
              availableTags={availableTaskTags}
              selectedTags={taskTags}
              onChange={setTaskTags}
              placeholder="Chọn hoặc gõ tên thẻ mới..."
            />

            {/* Suggested Tags Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-slate-400">
              <span className="font-medium">Gợi ý nhanh:</span>
              {DEFAULT_SUGGESTED_TASK_TAGS.filter((s) => !taskTags.includes(s.toLowerCase())).map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      const clean = suggestion.toLowerCase();
                      if (!taskTags.includes(clean)) {
                        setTaskTags([...taskTags, clean]);
                      }
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 hover:bg-brand/10 hover:text-brand text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    +{suggestion}
                  </button>
                )
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Đang tạo...' : 'Tạo Công Việc'}
          </button>
        </form>
      )}

      {/* Tab 3: Ghi Chú (Matches NotesPage Add Modal) */}
      {activeTab === 'note' && (
        <form onSubmit={handleCreateNote} className="space-y-4 text-xs mt-4">
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Tiêu đề ghi chú
            </label>
            <input
              type="text"
              required
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="VD: Kế hoạch tuần tới..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand font-medium text-xs"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Thẻ phân loại (Tags)
            </label>
            <TagSelect
              availableTags={availableNoteTags}
              selectedTags={noteTags}
              onChange={setNoteTags}
              placeholder="Chọn hoặc nhập thẻ mới..."
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Nội dung ghi chú (Markdown)
            </label>
            <MarkdownEditor
              value={noteContent}
              onChange={setNoteContent}
              rows={6}
              placeholder="Nhập nội dung ghi chú (hỗ trợ tiêu đề, danh sách, bảng, task list...)"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu Ghi Chú'}
          </button>
        </form>
      )}
    </Modal>
  );
};
