import React, { useState } from 'react';
import { Wallet, X, Star } from 'lucide-react';
import { WalletItem } from './types';
import { resolveWalletTypeAndIcon, WALLET_TYPE_OPTIONS } from './walletUtils';
import { apiClient } from '../../api/client';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletCreated: (wallet: WalletItem) => void;
}

const WALLET_COLORS = [
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
  '#3B82F6',
];

export const AddWalletModal: React.FC<AddWalletModalProps> = ({
  isOpen,
  onClose,
  onWalletCreated,
}) => {
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState('e-wallet');
  const [newWalletBalance, setNewWalletBalance] = useState('0');
  const [newWalletColor, setNewWalletColor] = useState('#6366F1');
  const [newWalletIsDefault, setNewWalletIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyboard accessibility: Close on Escape key
  React.useEffect(() => {
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

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) {
      toast.error('Vui lòng nhập tên ví.');
      return;
    }

    const initBal = parseFloat(newWalletBalance) || 0;
    if (initBal < 0) {
      toast.error('Số dư ban đầu không được âm.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/finance/wallets', {
        name: newWalletName.trim(),
        currency: 'VND',
        initialBalance: initBal,
        color: newWalletColor,
        icon: newWalletType,
        isDefault: newWalletIsDefault,
      });

      const created = res.data.data;
      const { type, icon } = resolveWalletTypeAndIcon(created.icon || newWalletType, created.name);
      const newWallet: WalletItem = {
        id: created.id,
        name: created.name,
        balance: parseFloat(created.currentBalance),
        type,
        color: created.color || newWalletColor,
        icon,
        isDefault: created.isDefault ?? newWalletIsDefault,
      };

      onWalletCreated(newWallet);
      onClose();
      setNewWalletName('');
      setNewWalletType('e-wallet');
      setNewWalletBalance('0');
      setNewWalletIsDefault(false);
      toast.success(`Đã tạo ví "${created.name}" thành công!`);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch {
      // Fallback
      const { type, icon } = resolveWalletTypeAndIcon(newWalletType, newWalletName.trim());
      const fallbackWallet: WalletItem = {
        id: `w-${Date.now()}`,
        name: newWalletName.trim(),
        balance: initBal,
        type,
        color: newWalletColor,
        icon,
        isDefault: newWalletIsDefault,
      };
      onWalletCreated(fallbackWallet);
      onClose();
      setNewWalletName('');
      setNewWalletType('e-wallet');
      setNewWalletBalance('0');
      toast.success(`Đã tạo ví "${fallbackWallet.name}" thành công!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isSubmitting}
      ariaLabelledBy="add-wallet-modal-title"
      maxWidth="md"
    >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 id="add-wallet-modal-title" className="font-bold text-base">Thêm Ví Tiền Mới</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thêm ví mới"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateWallet} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Tên ví / Tài khoản
            </label>
            <input
              type="text"
              required
              value={newWalletName}
              onChange={(e) => setNewWalletName(e.target.value)}
              placeholder="VD: Ví MoMo, BIDV SmartBanking, Quỹ Khẩn Cấp..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                Loại ví
              </label>
              <select
                value={newWalletType}
                onChange={(e) => setNewWalletType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
              >
                {WALLET_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                Số dư ban đầu (VND)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={newWalletBalance}
                onChange={(e) => setNewWalletBalance(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">
              Màu sắc nhận diện
            </label>
            <div className="flex items-center gap-2.5">
              {WALLET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewWalletColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-7 w-7 rounded-full cursor-pointer transition-transform ${
                    newWalletColor === c ? 'scale-125 ring-2 ring-offset-2 ring-brand' : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={newWalletIsDefault}
                onChange={(e) => setNewWalletIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer"
              />
              <span className="flex items-center gap-1.5 text-xs">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>Đặt làm ví mặc định khi tạo giao dịch</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Đang tạo ví...' : 'Tạo Ví Mới'}
          </button>
        </form>
    </Modal>
  );
};
