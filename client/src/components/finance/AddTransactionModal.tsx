import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { WalletItem, CategoryItem, TransactionItem } from './types';
import { apiClient, getErrorMessage } from '../../api/client';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: WalletItem[];
  categories: CategoryItem[];
  onTransactionCreated: (
    newTx: TransactionItem,
    walletId: string,
    deltaBalance: number
  ) => void;
  onOpenCategoryModal: () => void;
  initialCategory?: string;
  initialWalletId?: string;
  initialType?: 'EXPENSE' | 'INCOME';
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  wallets,
  categories,
  onTransactionCreated,
  onOpenCategoryModal,
  initialCategory,
  initialWalletId,
  initialType,
}) => {
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [txWalletId, setTxWalletId] = useState('');
  const [txAmount, setTxAmount] = useState('100000');
  const [txCategory, setTxCategory] = useState('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [txNote, setTxNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 1. Pre-fill Wallet
      if (initialWalletId && wallets.some((w) => w.id === initialWalletId)) {
        setTxWalletId(initialWalletId);
      } else if (wallets.length > 0 && (!txWalletId || !wallets.some((w) => w.id === txWalletId))) {
        const defaultWallet = wallets.find((w) => w.isDefault) || wallets[0];
        setTxWalletId(defaultWallet.id);
      }

      // 2. Pre-fill Type
      const targetType = initialType || 'EXPENSE';
      setTxType(targetType);

      // 3. Pre-fill Category
      const validCats = categories.filter((c) => c.type === targetType);
      if (initialCategory && initialCategory !== 'ALL' && categories.some((c) => c.name === initialCategory)) {
        const matchedCat = categories.find((c) => c.name === initialCategory);
        if (matchedCat) {
          setTxType(matchedCat.type as 'EXPENSE' | 'INCOME');
          setTxCategory(matchedCat.name);
        }
      } else if (validCats.length > 0 && !validCats.some((c) => c.name === txCategory)) {
        setTxCategory(validCats[0].name);
      } else if (validCats.length === 0) {
        setTxCategory('');
      }

      setTxDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen, wallets, categories, initialCategory, initialWalletId, initialType]);

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

  if (!isOpen) return null;

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ (> 0).');
      return;
    }

    const selectedWalletId = txWalletId || (wallets.find((w) => w.isDefault)?.id || wallets[0]?.id);
    const targetWallet = wallets.find((w) => w.id === selectedWalletId);
    if (!targetWallet) {
      toast.error('Vui lòng chọn ví thực hiện giao dịch.');
      return;
    }

    if (!txCategory.trim()) {
      toast.error('Vui lòng chọn hoặc tạo danh mục trước khi ghi nhận giao dịch.');
      return;
    }

    if (txType === 'EXPENSE' && targetWallet.balance < amt) {
      toast.error(`Số dư ví "${targetWallet.name}" không đủ để chi tiêu.`);
      return;
    }

    setIsSubmitting(true);
    let createdId = `tx-${Date.now()}`;
    const targetDateObj = txDate ? new Date(`${txDate}T12:00:00Z`) : new Date();

    try {
      const res = await apiClient.post('/finance/transactions', {
        walletId: selectedWalletId,
        type: txType,
        amount: amt,
        category: txCategory,
        transactionDate: targetDateObj.toISOString(),
        note: txNote || undefined,
      });
      if (res.data?.data?.id) {
        createdId = res.data.data.id;
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ghi nhận giao dịch.'));
      setIsSubmitting(false);
      return;
    }

    const delta = txType === 'INCOME' ? amt : -amt;
    const newTx: TransactionItem = {
      id: createdId,
      type: txType,
      wallet: targetWallet.name,
      walletId: selectedWalletId,
      category: txCategory,
      amount: amt,
      date: targetDateObj.toLocaleDateString('vi-VN'),
      rawDate: txDate || targetDateObj.toISOString().slice(0, 10),
      note: txNote,
    };

    onTransactionCreated(newTx, selectedWalletId, delta);
    onClose();
    setTxAmount('100000');
    setTxNote('');
    setIsSubmitting(false);
    toast.success(
      txType === 'INCOME'
        ? `Đã ghi nhận khoản thu: +${formatCurrency(amt)}`
        : `Đã ghi nhận khoản chi: -${formatCurrency(amt)}`
    );
    window.dispatchEvent(new CustomEvent('flux:refresh-data'));
  };

  const filteredCategories = categories.filter(
    (c) => c.type === txType
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isSubmitting}
      ariaLabelledBy="add-tx-modal-title"
      maxWidth="md"
    >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <h3 id="add-tx-modal-title" className="font-bold text-base">Ghi Nhận Giao Dịch</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng ghi nhận giao dịch"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs">
          {/* Transaction Type Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTxType('EXPENSE')}
              className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                txType === 'EXPENSE'
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
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
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
              }`}
            >
              Khoản Thu Tiền (+)
            </button>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Chọn Ví
            </label>
            <select
              value={txWalletId || (wallets.find((w) => w.isDefault)?.id || wallets[0]?.id || '')}
              onChange={(e) => setTxWalletId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.isDefault ? ' (Mặc định)' : ''} ({formatCurrency(w.balance)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                Số tiền (VND)
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="VD: 100000"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base font-extrabold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                Ngày giao dịch
              </label>
              <input
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1 text-slate-700 dark:text-slate-300">
              <label className="font-semibold">Danh mục</label>
              <button
                type="button"
                onClick={onOpenCategoryModal}
                className="text-brand hover:underline text-[11px] font-medium cursor-pointer"
              >
                + Quản lý danh mục
              </button>
            </div>
            {filteredCategories.length === 0 ? (
              <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs flex items-center justify-between">
                <span className="text-slate-500">Chưa có danh mục cho khoản này.</span>
                <button
                  type="button"
                  onClick={onOpenCategoryModal}
                  className="font-bold text-brand hover:underline cursor-pointer"
                >
                  + Tạo danh mục ngay
                </button>
              </div>
            ) : (
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Ghi chú
            </label>
            <input
              type="text"
              value={txNote}
              onChange={(e) => setTxNote(e.target.value)}
              placeholder="VD: Ăn tối với bạn, thanh toán hóa đơn..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
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
    </Modal>
  );
};
