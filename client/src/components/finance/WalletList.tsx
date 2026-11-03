import React from 'react';
import { Wallet, Plus, Star, Edit3, Trash2 } from 'lucide-react';
import { WalletItem } from './types';
import { formatCurrency } from '../../lib/utils';
import { Tooltip, InfoTooltip } from '../common/Tooltip';

interface WalletListProps {
  wallets: WalletItem[];
  isLoading?: boolean;
  onOpenAddWallet?: () => void;
  onSetDefaultWallet?: (walletId: string) => void;
  onEditWallet?: (wallet: WalletItem) => void;
  onDeleteWallet?: (wallet: WalletItem) => void;
}

export const WalletList = React.memo<WalletListProps>(({
  wallets,
  isLoading = false,
  onOpenAddWallet,
  onSetDefaultWallet,
  onEditWallet,
  onDeleteWallet,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-sm text-slate-700 dark:text-slate-300">
            Danh Sách Ví Tiền ({isLoading ? '…' : wallets.length})
          </h2>
          <InfoTooltip content="Mỗi ví đại diện cho một tài khoản ngân hàng, ví tiền mặt hoặc thẻ để theo dõi số dư độc lập." />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-850 rounded w-16" />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Chưa có ví tiền nào
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Tạo ví tiền mặt hoặc tài khoản ngân hàng để bắt đầu theo dõi thu chi và quản lý số dư.
            </p>
          </div>
          {onOpenAddWallet && (
            <button
              type="button"
              onClick={onOpenAddWallet}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Ví Đầu Tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {wallets.map((w) => {
            const Icon = w.icon || Wallet;
            return (
              <div
                key={w.id}
                className="p-4 rounded-lg border border-border bg-card shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-8 w-8 rounded-md flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: w.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs line-clamp-1 text-foreground" title={w.name}>
                        {w.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{w.type}</div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {w.isDefault ? (
                      <Tooltip content="Ví mặc định được hệ thống chọn sẵn khi bạn ghi nhận giao dịch mới.">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 cursor-help">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>Mặc định</span>
                        </span>
                      </Tooltip>
                    ) : (
                      onSetDefaultWallet && (
                        <Tooltip content="Đặt ví này làm ví ưu tiên chọn sẵn khi thêm giao dịch.">
                          <button
                            type="button"
                            onClick={() => onSetDefaultWallet(w.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors cursor-pointer"
                          >
                            <Star className="w-3 h-3" />
                            <span>Đặt mặc định</span>
                          </button>
                        </Tooltip>
                      )
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div className="text-lg font-bold tabular-nums text-foreground">
                    {formatCurrency(w.balance)}
                  </div>
                  <div className="flex items-center gap-1">
                    {onEditWallet && (
                      <Tooltip content="Chỉnh sửa thông tin ví">
                        <button
                          type="button"
                          onClick={() => onEditWallet(w)}
                          aria-label={`Chỉnh sửa ví: ${w.name}`}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-ring"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                    )}
                    {onDeleteWallet && (
                      <Tooltip content="Xóa ví này">
                        <button
                          type="button"
                          onClick={() => onDeleteWallet(w)}
                          aria-label={`Xóa ví: ${w.name}`}
                          className="p-1 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer focus-ring"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  if (prev.isLoading !== next.isLoading) return false;
  if (prev.wallets === next.wallets) return true;
  if (prev.wallets.length !== next.wallets.length) return false;
  return prev.wallets.every((w, i) => {
    const nextW = next.wallets[i];
    return (
      nextW &&
      w.id === nextW.id &&
      w.balance === nextW.balance &&
      w.isDefault === nextW.isDefault &&
      w.name === nextW.name &&
      w.color === nextW.color &&
      w.icon === nextW.icon
    );
  });
});

WalletList.displayName = 'WalletList';
