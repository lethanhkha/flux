import React from 'react';
import { Wallet, Plus } from 'lucide-react';
import { WalletItem } from './types';
import { formatCurrency } from '../../lib/utils';

interface WalletListProps {
  wallets: WalletItem[];
  isLoading?: boolean;
  onOpenAddWallet?: () => void;
}

export const WalletList: React.FC<WalletListProps> = ({
  wallets,
  isLoading = false,
  onOpenAddWallet,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm text-slate-700 dark:text-slate-300">
          Danh Sách Ví Tiền ({isLoading ? '...' : wallets.length})
        </h2>
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
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover-lift space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: w.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs line-clamp-1">{w.name}</div>
                      <div className="text-[10px] text-slate-500">{w.type}</div>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatCurrency(w.balance)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
