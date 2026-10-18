import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, X } from 'lucide-react';
import { WalletItem } from './types';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { InfoTooltip } from '../common/Tooltip';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: WalletItem[];
  onTransfer: (
    sourceWalletId: string,
    destWalletId: string,
    amount: number,
    note: string
  ) => Promise<void>;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  wallets,
  onTransfer,
}) => {
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [destWalletId, setDestWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('1000000');
  const [transferNote, setTransferNote] = useState('Rút tiền mặt tiêu dùng');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && wallets.length > 0) {
      const defaultWallet = wallets.find((w) => w.isDefault) || wallets[0];
      if (!sourceWalletId || !wallets.some((w) => w.id === sourceWalletId)) {
        setSourceWalletId(defaultWallet.id);
      }
      if (!destWalletId || !wallets.some((w) => w.id === destWalletId)) {
        const otherWallet = wallets.find((w) => w.id !== defaultWallet.id) || wallets[0];
        setDestWalletId(otherWallet.id);
      }
    }
  }, [isOpen, wallets]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);

    if (isNaN(amt) || amt <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ (> 0).');
      return;
    }

    if (sourceWalletId === destWalletId) {
      toast.error('Ví nguồn và ví đích không được trùng nhau.');
      return;
    }

    const src = wallets.find((w) => w.id === sourceWalletId);
    if (!src || src.balance < amt) {
      toast.error('Số dư ví nguồn không đủ để thực hiện chuyển tiền.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onTransfer(sourceWalletId, destWalletId, amt, transferNote);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isSubmitting}
      ariaLabelledBy="transfer-modal-title"
      maxWidth="md"
    >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h3 id="transfer-modal-title" className="font-bold text-base">Chuyển Tiền Giữa Các Ví</h3>
              <InfoTooltip content="Chuyển tiền nội bộ chỉ trừ tiền ví nguồn và cộng tiền ví đích, không làm thay đổi tổng tài sản." />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chuyển tiền"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="font-semibold block">Ví nguồn (Trừ tiền)</label>
              <InfoTooltip content="Số tiền chuyển sẽ được trừ khỏi số dư của ví này." />
            </div>
            <select
              value={sourceWalletId}
              onChange={(e) => setSourceWalletId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.isDefault ? ' (Mặc định)' : ''} ({formatCurrency(w.balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="font-semibold block">Ví đích (Cộng tiền)</label>
              <InfoTooltip content="Số tiền chuyển sẽ được cộng vào số dư của ví này." />
            </div>
            <select
              value={destWalletId}
              onChange={(e) => setDestWalletId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.isDefault ? ' (Mặc định)' : ''} ({formatCurrency(w.balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-1">Số tiền chuyển (VND)</label>
            <input
              type="number"
              required
              min="1"
              step="any"
              placeholder="VD: 47857"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base font-extrabold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Ghi chú chuyển khoản</label>
            <input
              type="text"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Đang thực hiện...' : 'Xác Nhận Chuyển Tiền'}
          </button>
        </form>
    </Modal>
  );
};
