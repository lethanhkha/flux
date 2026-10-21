import React, { useState, useEffect } from 'react';
import { Edit3, X, Wallet as WalletIcon, Tag as TagIcon } from 'lucide-react';
import { WalletItem, CategoryItem, TransactionItem } from './types';
import { apiClient, getErrorMessage } from '../../api/client';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { CustomSelect } from '../common/CustomSelect';
import { InfoTooltip } from '../common/Tooltip';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionItem | null;
  wallets: WalletItem[];
  categories: CategoryItem[];
  onSuccess: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  wallets,
  categories,
  onSuccess,
}) => {
  const [editTxType, setEditTxType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
  const [editTxWalletId, setEditTxWalletId] = useState('');
  const [editTxDestWalletId, setEditTxDestWalletId] = useState('');
  const [editTxAmount, setEditTxAmount] = useState('100000');
  const [editTxCategory, setEditTxCategory] = useState('Ăn uống & Cafe');
  const [editTxDate, setEditTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [editTxNote, setEditTxNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && transaction) {
      setEditTxType(transaction.type);

      const matchedWallet = wallets.find(
        (w) => w.id === transaction.walletId || w.name === transaction.wallet
      );
      setEditTxWalletId(matchedWallet?.id || wallets[0]?.id || '');

      if (transaction.destWalletId || transaction.destWallet) {
        const matchedDestWallet = wallets.find(
          (w) => w.id === transaction.destWalletId || w.name === transaction.destWallet
        );
        setEditTxDestWalletId(matchedDestWallet?.id || wallets[1]?.id || wallets[0]?.id || '');
      } else {
        setEditTxDestWalletId(wallets[1]?.id || wallets[0]?.id || '');
      }

      setEditTxAmount(transaction.amount.toString());
      setEditTxCategory(transaction.category);
      setEditTxDate(transaction.rawDate || new Date().toISOString().slice(0, 10));
      setEditTxNote(transaction.note || '');
    }
  }, [isOpen, transaction, wallets]);

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

  if (!isOpen || !transaction) return null;

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    const amt = parseFloat(editTxAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ (> 0).');
      return;
    }

    const srcWallet = wallets.find((w) => w.id === editTxWalletId);
    if (!srcWallet) {
      toast.error('Vui lòng chọn ví thực hiện.');
      return;
    }

    if (editTxType === 'TRANSFER' && editTxWalletId === editTxDestWalletId) {
      toast.error('Ví nguồn và ví đích không được trùng nhau.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        type: editTxType,
        walletId: editTxWalletId,
        amount: amt,
        category: editTxType === 'TRANSFER' ? 'Chuyển tiền nội bộ' : (editTxCategory || 'Khác'),
        note: editTxNote || undefined,
        transactionDate: editTxDate ? new Date(editTxDate).toISOString() : undefined,
      };
      if (editTxType === 'TRANSFER') {
        payload.destinationWalletId = editTxDestWalletId;
      }

      await apiClient.patch(`/finance/transactions/${transaction.id}`, payload);

      toast.success('Đã cập nhật giao dịch thành công!');
      onSuccess();
      onClose();
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật giao dịch.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(
    (c) => c.type === editTxType || c.type === 'EXPENSE'
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isSubmitting}
      ariaLabelledBy="edit-tx-modal-title"
      maxWidth="md"
    >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="edit-tx-modal-title" className="font-bold text-base">Chỉnh Sửa Giao Dịch</h3>
              <p className="text-[11px] text-slate-400">
                Số dư các ví liên quan sẽ được tự động tính toán lại
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chỉnh sửa giao dịch"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpdateTransaction} className="space-y-4 text-xs">
          {/* Transaction Type Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setEditTxType('EXPENSE')}
              className={`py-2 rounded-xl font-bold transition-all cursor-pointer text-center text-xs ${
                editTxType === 'EXPENSE'
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
              }`}
            >
              Chi tiền (-)
            </button>
            <button
              type="button"
              onClick={() => setEditTxType('INCOME')}
              className={`py-2 rounded-xl font-bold transition-all cursor-pointer text-center text-xs ${
                editTxType === 'INCOME'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
              }`}
            >
              Thu tiền (+)
            </button>
            <button
              type="button"
              onClick={() => setEditTxType('TRANSFER')}
              className={`py-2 rounded-xl font-bold transition-all cursor-pointer text-center text-xs ${
                editTxType === 'TRANSFER'
                  ? 'bg-brand/10 border border-brand/30 text-brand'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
              }`}
            >
              Chuyển khoản
            </button>
          </div>

          {/* Wallets selection */}
          {editTxType === 'TRANSFER' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="font-semibold block text-slate-700 dark:text-slate-300">
                    Ví nguồn (Trừ tiền)
                  </label>
                  <InfoTooltip content="Ví tiền sẽ bị khấu trừ khoản chuyển này." />
                </div>
                <CustomSelect
                  value={editTxWalletId}
                  onChange={(val) => setEditTxWalletId(val)}
                  options={wallets.map((w) => ({
                    value: w.id,
                    label: `${w.name}${w.isDefault ? ' (Mặc định)' : ''}`,
                    color: w.color,
                    badge: formatCurrency(w.balance),
                  }))}
                  icon={<WalletIcon className="w-4 h-4 text-brand" />}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="font-semibold block text-slate-700 dark:text-slate-300">
                    Ví đích (Cộng tiền)
                  </label>
                  <InfoTooltip content="Ví tiền sẽ được ghi nhận cộng thêm khoản chuyển này." />
                </div>
                <CustomSelect
                  value={editTxDestWalletId}
                  onChange={(val) => setEditTxDestWalletId(val)}
                  options={wallets.map((w) => ({
                    value: w.id,
                    label: `${w.name}${w.isDefault ? ' (Mặc định)' : ''}`,
                    color: w.color,
                    badge: formatCurrency(w.balance),
                  }))}
                  icon={<WalletIcon className="w-4 h-4 text-brand" />}
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="font-semibold block text-slate-700 dark:text-slate-300">
                  Chọn Ví
                </label>
                <InfoTooltip content="Ví thực hiện giao dịch thu hoặc chi này." />
              </div>
              <CustomSelect
                value={editTxWalletId}
                onChange={(val) => setEditTxWalletId(val)}
                options={wallets.map((w) => ({
                  value: w.id,
                  label: `${w.name}${w.isDefault ? ' (Mặc định)' : ''}`,
                  color: w.color,
                  badge: formatCurrency(w.balance),
                }))}
                icon={<WalletIcon className="w-4 h-4 text-brand" />}
              />
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="font-semibold block text-slate-700 dark:text-slate-300">
                  Số tiền (VND)
                </label>
                <InfoTooltip content="Số tiền giao dịch đã cập nhật (> 0)." />
              </div>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="VD: 47857"
                value={editTxAmount}
                onChange={(e) => setEditTxAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base font-extrabold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="font-semibold block text-slate-700 dark:text-slate-300">
                  Ngày giao dịch
                </label>
                <InfoTooltip content="Ngày phát sinh giao dịch." />
              </div>
              <input
                type="date"
                required
                value={editTxDate}
                onChange={(e) => setEditTxDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          {/* Category if not transfer */}
          {editTxType !== 'TRANSFER' && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="font-semibold block text-slate-700 dark:text-slate-300">
                  Danh mục
                </label>
                <InfoTooltip content="Phân loại thu chi của giao dịch này." />
              </div>
              <CustomSelect
                value={editTxCategory}
                onChange={(val) => setEditTxCategory(val)}
                options={filteredCategories.map((c) => ({
                  value: c.name,
                  label: c.name,
                  color: c.color,
                }))}
                icon={<TagIcon className="w-4 h-4 text-brand" />}
              />
            </div>
          )}

          {/* Note */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="font-semibold block text-slate-700 dark:text-slate-300">
                Ghi chú
              </label>
              <InfoTooltip content="Nội dung hoặc ghi chú giải thích giao dịch (tùy chọn)." />
            </div>
            <input
              type="text"
              value={editTxNote}
              onChange={(e) => setEditTxNote(e.target.value)}
              placeholder="VD: Ăn tối với bạn, thanh toán hóa đơn..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
    </Modal>
  );
};
