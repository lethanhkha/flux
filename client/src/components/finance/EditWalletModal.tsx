import React, { useState, useEffect } from 'react';
import { Wallet, X, Star, Info } from 'lucide-react';
import { WalletItem } from './types';
import { resolveWalletTypeAndIcon, WALLET_TYPE_OPTIONS } from './walletUtils';
import { apiClient, getErrorMessage } from '../../api/client';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { CustomSelect } from '../common/CustomSelect';
import { InfoTooltip } from '../common/Tooltip';

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
            <h3 id="edit-wallet-modal-title" className="font-semibold text-base text-foreground">
              Chỉnh Sửa Ví
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Cập nhật tên gọi, phân loại và màu sắc nhận diện của ví
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chỉnh sửa ví"
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-[background-color] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs mt-3">
        {/* Wallet Name */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <label className="font-medium block text-foreground">
              Tên ví / Tài khoản
            </label>
            <InfoTooltip content="Tên gọi gợi nhớ của ví hoặc tài khoản ngân hàng." />
          </div>
          <input
            type="text"
            required
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            placeholder="VD: Ví MoMo, BIDV SmartBanking, Quỹ Khẩn Cấp…"
            className="w-full px-3 py-2 rounded-md border border-input bg-background font-medium focus-ring"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Wallet Type */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="font-medium block text-foreground">
                Loại ví
              </label>
              <InfoTooltip content="Phân loại ví để áp dụng biểu tượng tương ứng." />
            </div>
            <CustomSelect
              value={walletType}
              onChange={(val) => setWalletType(val)}
              options={WALLET_TYPE_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
            />
          </div>

          {/* Current Balance (Read-only) */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="font-medium block text-foreground">
                Số dư hiện tại
              </label>
              <InfoTooltip content="Số dư hiện tại chỉ được cập nhật qua các giao dịch thu, chi hoặc chuyển khoản." />
            </div>
            <div className="px-3 py-2 rounded-md border border-border bg-muted/50 font-mono font-bold tabular-nums text-foreground">
              {formatCurrency(wallet.balance)}
            </div>
          </div>
        </div>

        {/* Read-only balance explanation notice */}
        <div className="p-2.5 rounded-md bg-muted/40 border border-border flex items-start gap-2 text-[11px] text-muted-foreground">
          <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <span>
            Số dư ví được tự động đối soát theo lịch sử giao dịch. Để điều chỉnh số dư, bạn có thể tạo giao dịch thu chi mới hoặc chuyển tiền.
          </span>
        </div>

        {/* Color Palette Picker */}
        <div>
          <label className="font-medium block mb-1.5 text-foreground">
            Màu sắc nhận diện
          </label>
          <div className="flex items-center gap-2.5">
            {WALLET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setWalletColor(c)}
                style={{ backgroundColor: c }}
                className={`h-6 w-6 rounded-full cursor-pointer transition-transform ${
                  walletColor === c ? 'scale-125 ring-2 ring-offset-2 ring-foreground' : 'hover:scale-110'
                }`}
                aria-label={`Chọn màu ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Default Wallet Checkbox */}
        <div className="p-2.5 rounded-md bg-muted/40 border border-border">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground select-none">
            <input
              type="checkbox"
              checked={walletIsDefault}
              onChange={(e) => setWalletIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-input text-foreground focus-ring cursor-pointer"
            />
            <span className="flex items-center gap-1.5 text-xs">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Đặt làm ví mặc định khi ghi nhận thu chi</span>
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 h-10 rounded-md border border-border bg-secondary hover:bg-muted text-foreground font-medium text-xs transition-[background-color] cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-10 rounded-md bg-foreground text-background font-medium text-xs hover:opacity-90 active:scale-[0.99] transition-[opacity,transform] cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Đang lưu…' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
