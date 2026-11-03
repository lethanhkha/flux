import React from 'react';
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, Edit3, Trash2 } from 'lucide-react';
import { TransactionItem } from './types';
import { formatCurrency } from '../../lib/utils';
import { Tooltip } from '../common/Tooltip';

export interface TransactionRowProps {
  tx: TransactionItem;
  selectedCategory?: string;
  selectedWalletId?: string;
  onSelectCategory?: (category: string) => void;
  onSelectWallet?: (walletId: string) => void;
  onOpenEditTx: (tx: TransactionItem) => void;
  onRequestDeleteTx: (tx: TransactionItem, e?: React.MouseEvent) => void;
}

export const TransactionRow = React.memo<TransactionRowProps>(({
  tx,
  selectedCategory,
  selectedWalletId,
  onSelectCategory,
  onSelectWallet,
  onOpenEditTx,
  onRequestDeleteTx,
}) => {
  return (
    <div
      className="p-3 rounded-lg border border-border bg-card flex items-center justify-between gap-4 hover:bg-muted/40 transition-[background-color,border-color] group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Tooltip
          content={
            tx.type === 'INCOME'
              ? 'Giao dịch thu tiền vào (+)'
              : tx.type === 'EXPENSE'
              ? 'Giao dịch chi tiêu ra (-)'
              : 'Giao dịch chuyển tiền nội bộ (↔)'
          }
        >
          <div
            className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 border ${
              tx.type === 'INCOME'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : tx.type === 'EXPENSE'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : 'bg-muted text-foreground border-border'
            }`}
          >
            {tx.type === 'INCOME' && <ArrowDownRight className="w-4 h-4" aria-hidden="true" />}
            {tx.type === 'EXPENSE' && <ArrowUpRight className="w-4 h-4" aria-hidden="true" />}
            {tx.type === 'TRANSFER' && <ArrowRightLeft className="w-4 h-4" aria-hidden="true" />}
          </div>
        </Tooltip>

        <div className="min-w-0">
          <Tooltip content={`Lọc theo danh mục “${tx.category}”`}>
            <button
              type="button"
              onClick={() =>
                onSelectCategory?.(
                  selectedCategory === tx.category ? 'ALL' : tx.category
                )
              }
              className="font-medium text-xs text-foreground hover:underline transition-colors cursor-pointer truncate text-left block"
            >
              {tx.category}
            </button>
          </Tooltip>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
            <span>{tx.date}</span>
            <span>•</span>
            <Tooltip
              content={
                tx.type === 'TRANSFER'
                  ? `Lọc theo ví ${tx.wallet} hoặc ${tx.destWallet}`
                  : `Lọc theo ví ${tx.wallet}`
              }
            >
              <button
                type="button"
                onClick={() => {
                  if (tx.walletId && onSelectWallet) {
                    onSelectWallet(
                      selectedWalletId === tx.walletId ? 'ALL' : tx.walletId
                    );
                  }
                }}
                className="truncate hover:text-foreground cursor-pointer text-left"
              >
                {tx.type === 'TRANSFER'
                  ? `${tx.wallet} → ${tx.destWallet}`
                  : tx.wallet}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div className="text-right">
          <div
            className={`text-xs sm:text-sm font-semibold tabular-nums ${
              tx.type === 'INCOME'
                ? 'text-emerald-600 dark:text-emerald-400'
                : tx.type === 'EXPENSE'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-foreground'
            }`}
          >
            {tx.type === 'INCOME'
              ? `+${formatCurrency(tx.amount)}`
              : tx.type === 'EXPENSE'
              ? `-${formatCurrency(tx.amount)}`
              : `${formatCurrency(tx.amount)}`}
          </div>
          {tx.note && (
            <div className="text-[10px] text-muted-foreground line-clamp-1 max-w-[140px] sm:max-w-[200px]">
              {tx.note}
            </div>
          )}
        </div>

        {/* Actions: Edit & Delete buttons */}
        <div className="flex items-center gap-0.5 opacity-80 sm:opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity">
          <Tooltip content="Chỉnh sửa giao dịch này">
            <button
              type="button"
              onClick={() => onOpenEditTx(tx)}
              aria-label={`Chỉnh sửa giao dịch ${tx.category}: ${formatCurrency(tx.amount)}`}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-ring"
            >
              <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip content="Xóa giao dịch này">
            <button
              type="button"
              onClick={(e) => onRequestDeleteTx(tx, e)}
              aria-label={`Xóa giao dịch ${tx.category}: ${formatCurrency(tx.amount)}`}
              className="p-1 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer focus-ring"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
});

TransactionRow.displayName = 'TransactionRow';
