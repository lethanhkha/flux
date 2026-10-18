import React, { useState, useEffect } from 'react';
import { Wallet, X, Star, Info } from 'lucide-react';
import { WalletItem } from './types';
import { resolveWalletTypeAndIcon, WALLET_TYPE_OPTIONS } from './walletUtils';
import { apiClient, getErrorMessage } from '../../api/client';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';

interface EditWalletModalProps {
  isOpen: boolean;
  wallet: WalletItem | null;
  onClose: () => void;
  onWalletUpdated: (wallet: WalletItem) => void;
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

export const EditWalletModal: React.FC<EditWalletModalProps> = ({
  isOpen,
  wallet,
  onClose,
  onWalletUpdated,
}) => {
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState('e-wallet');
  const [walletColor, setWalletColor] = useState('#6366F1');
  const [walletIsDefault, setWalletIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize state when wallet prop changes or modal opens
  useEffect(() => {
    if (!wallet) return;

    setWalletName(wallet.name || '');
    setWalletColor(wallet.color || '#6366F1');
    setWalletIsDefault(Boolean(wallet.isDefault));

    // Find matching type code from label or default to e-wallet
    const match = WALLET_TYPE_OPTIONS.find(
      (opt) =>
        opt.label.toLowerCase() === (wallet.type || '').toLowerCase() ||
        opt.value.toLowerCase() === (wallet.type || '').toLowerCase()
    );
    setWalletType(match ? match.value : 'e-wallet');
  }, [wallet, isOpen]);

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

  if (!isOpen || !wallet) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName.trim()) {
      toast.error('Vui lòng nhập tên ví.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.patch(`/finance/wallets/${wallet.id}`, {
        name: walletName.trim(),
        icon: walletType,
        color: walletColor,
        isDefault: walletIsDefault,
      });

      const updated = res.data?.data || {};
      const { type, icon } = resolveWalletTypeAndIcon(
        updated.icon || walletType,
        updated.name || walletName.trim()
      );

      const updatedWalletItem: WalletItem = {
        ...wallet,
        name: updated.name || walletName.trim(),
        color: updated.color || walletColor,
        type,
        icon,
        isDefault: updated.isDefault !== undefined ? updated.isDefault : walletIsDefault,
      };

      onWalletUpdated(updatedWalletItem);
      onClose();
      toast.success(`Đã cập nhật thông tin ví "${updatedWalletItem.name}" thành công!`);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật thông tin ví.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentIcon = wallet.icon || Wallet;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isSubmitting}
      ariaLabelledBy="edit-wallet-modal-title"
      maxWidth="md"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-bold transition-colors"
            style={{ backgroundColor: walletColor }}
          >
            <CurrentIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 id="edit-wallet-modal-title" className="font-bold text-base">
              Chỉnh Sửa Ví Tiền
            </h3>
            <p className="text-[11px] text-slate-400">
              Cập nhật tên gọi, phân loại và màu sắc nhận diện của ví
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chỉnh sửa ví"
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs mt-3">
        {/* Wallet Name */}
        <div>
          <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
            Tên ví / Tài khoản
          </label>
          <input
            type="text"
            required
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            placeholder="VD: Ví MoMo, BIDV SmartBanking, Quỹ Khẩn Cấp..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Wallet Type */}
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Loại ví
            </label>
            <select
              value={walletType}
              onChange={(e) => setWalletType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
            >
              {WALLET_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Current Balance (Read-only) */}
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Số dư hiện tại
            </label>
            <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 font-mono font-bold text-slate-800 dark:text-slate-200">
              {formatCurrency(wallet.balance)}
            </div>
          </div>
        </div>

        {/* Read-only balance explanation notice */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
          <Info className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
          <span>
            Số dư ví được tự động đối soát theo lịch sử giao dịch. Để điều chỉnh số dư, bạn có thể tạo giao dịch thu chi mới hoặc chuyển tiền.
          </span>
        </div>

        {/* Color Palette Picker */}
        <div>
          <label className="font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">
            Màu sắc nhận diện
          </label>
          <div className="flex items-center gap-2.5">
            {WALLET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setWalletColor(c)}
                style={{ backgroundColor: c }}
                className={`h-7 w-7 rounded-full cursor-pointer transition-transform ${
                  walletColor === c ? 'scale-125 ring-2 ring-offset-2 ring-brand' : 'hover:scale-110'
                }`}
                aria-label={`Chọn màu ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Default Wallet Checkbox */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={walletIsDefault}
              onChange={(e) => setWalletIsDefault(e.target.checked)}
              className="w-4 h-4 rounded text-brand focus:ring-brand cursor-pointer"
            />
            <span className="flex items-center gap-1.5 text-xs">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Đặt làm ví mặc định khi ghi nhận thu chi</span>
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
