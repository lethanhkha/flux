import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, Edit3, Trash2 } from 'lucide-react';
import { TransactionItem } from './types';
import { formatCurrency } from '../../lib/utils';
import { Tooltip } from '../common/Tooltip';
import { staggerItem } from '../../lib/motionTokens';

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
    <motion.div
      variants={staggerItem}
      layout
      whileHover={{ y: -1 }}
      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 hover:border-brand/40 transition-colors group"
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
            className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 cursor-help ${
              tx.type === 'INCOME'
                ? 'bg-emerald-500/10 text-emerald-600'
                : tx.type === 'EXPENSE'
                ? 'bg-rose-500/10 text-rose-500'
                : 'bg-brand/10 text-brand'
            }`}
          >
            {tx.type === 'INCOME' && <ArrowDownRight className="w-5 h-5" />}
            {tx.type === 'EXPENSE' && <ArrowUpRight className="w-5 h-5" />}
            {tx.type === 'TRANSFER' && <ArrowRightLeft className="w-5 h-5" />}
          </div>
        </Tooltip>

        <div className="min-w-0">
          <Tooltip content={`Lọc nhanh theo danh mục "${tx.category}"`}>
            <div
              onClick={() =>
                onSelectCategory?.(
                  selectedCategory === tx.category ? 'ALL' : tx.category
                )
              }
              className="font-bold text-xs text-slate-800 dark:text-slate-100 hover:text-brand transition-colors cursor-pointer truncate"
            >
              {tx.category}
            </div>
          </Tooltip>
          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 truncate">
            <span>{tx.date}</span>
            <span>•</span>
            <Tooltip
              content={
                tx.type === 'TRANSFER'
                  ? `Lọc theo ví ${tx.wallet} hoặc ${tx.destWallet}`
                  : `Lọc theo ví ${tx.wallet}`
              }
            >
              <span
                onClick={() => {
                  if (tx.walletId && onSelectWallet) {
                    onSelectWallet(
                      selectedWalletId === tx.walletId ? 'ALL' : tx.walletId
                    );
                  }
                }}
                className="truncate hover:text-brand cursor-pointer"
              >
                {tx.type === 'TRANSFER'
                  ? `${tx.wallet} → ${tx.destWallet}`
                  : tx.wallet}
              </span>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <div className="text-right">
          <Tooltip
            content={
              tx.type === 'INCOME'
                ? `Khoản thu nhập vào ví: +${formatCurrency(tx.amount)}`
                : tx.type === 'EXPENSE'
                ? `Khoản chi tiêu từ ví: -${formatCurrency(tx.amount)}`
                : `Chuyển khoản nội bộ: ${formatCurrency(tx.amount)}`
            }
          >
            <div
              className={`text-sm font-extrabold tabular-nums cursor-help ${
                tx.type === 'INCOME'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : tx.type === 'EXPENSE'
                  ? 'text-rose-500 dark:text-rose-400'
                  : 'text-brand'
              }`}
            >
              {tx.type === 'INCOME'
                ? `+${formatCurrency(tx.amount)}`
                : tx.type === 'EXPENSE'
                ? `-${formatCurrency(tx.amount)}`
                : `${formatCurrency(tx.amount)}`}
            </div>
          </Tooltip>
          <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[140px] sm:max-w-[200px]">
            {tx.note}
          </div>
        </div>

        {/* Actions: Edit & Delete buttons */}
        <div className="flex items-center gap-1 opacity-80 sm:opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity">
          <Tooltip content="Chỉnh sửa giao dịch này">
            <button
              type="button"
              onClick={() => onOpenEditTx(tx)}
              aria-label={`Chỉnh sửa giao dịch ${tx.category}: ${formatCurrency(tx.amount)}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer focus-ring"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip content="Xóa giao dịch này">
            <button
              type="button"
              onClick={(e) => onRequestDeleteTx(tx, e)}
              aria-label={`Xóa giao dịch ${tx.category}: ${formatCurrency(tx.amount)}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer focus-ring"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
});

TransactionRow.displayName = 'TransactionRow';
