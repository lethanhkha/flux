import React from 'react';
import {
  Plus,
  Download,
  Tag,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Edit3,
  Trash2,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { TransactionItem, CategoryItem } from './types';
import { formatCurrency } from '../../lib/utils';
import { PaginationControl, PaginationMeta } from '../common/PaginationControl';

interface TransactionListProps {
  transactions: TransactionItem[];
  filteredTransactions: TransactionItem[];
  categories: CategoryItem[];
  filter: 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER';
  onFilterChange: (filter: 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER') => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenAddTx: () => void;
  onExportCSV: () => void;
  onOpenEditTx: (tx: TransactionItem) => void;
  onRequestDeleteTx: (tx: TransactionItem, e?: React.MouseEvent) => void;
  isLoading?: boolean;
  pagination?: PaginationMeta;
  onPageChange?: (newPage: number) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  filteredTransactions,
  categories,
  filter,
  onFilterChange,
  selectedCategory,
  onSelectCategory,
  onOpenAddTx,
  onExportCSV,
  onOpenEditTx,
  onRequestDeleteTx,
  isLoading = false,
  pagination,
  onPageChange,
}) => {
  const categoryBarRef = React.useRef<HTMLDivElement>(null);

  // Smooth mouse-wheel horizontal scrolling for category chips
  React.useEffect(() => {
    const el = categoryBarRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const canScrollLeft = el.scrollLeft > 0;
        const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;

        if ((e.deltaY > 0 && canScrollRight) || (e.deltaY < 0 && canScrollLeft)) {
          e.preventDefault();
          el.scrollBy({
            left: e.deltaY * 1.2,
            behavior: 'smooth',
          });
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-base">Lịch Sử Giao Dịch</h2>
          <p className="text-xs text-slate-500">Mọi khoản thu, chi và chuyển khoản có định dạng tabular-nums</p>
        </div>

        {/* Action buttons & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddTx}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Giao Dịch</span>
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-brand/40 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            title="Xuất danh sách giao dịch ra file CSV"
          >
            <Download className="w-3.5 h-3.5 text-brand" />
            <span>Xuất CSV</span>
          </button>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            {(['ALL', 'INCOME', 'EXPENSE', 'TRANSFER'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onFilterChange(type)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filter === type
                    ? 'bg-white dark:bg-slate-900 text-brand shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {type === 'ALL' && 'Tất Cả'}
                {type === 'INCOME' && 'Thu (+)'}
                {type === 'EXPENSE' && 'Chi (-)'}
                {type === 'TRANSFER' && 'Chuyển (↔)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Filter Chips Bar */}
      <div
        ref={categoryBarRef}
        className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar-x pb-2.5 pt-0.5 text-xs scroll-smooth"
      >
        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 pl-1 flex-shrink-0">
          <Tag className="w-3.5 h-3.5 text-brand" /> Danh mục:
        </span>
        <button
          type="button"
          onClick={() => onSelectCategory('ALL')}
          className={`px-3 py-1 rounded-xl text-xs transition-all cursor-pointer flex-shrink-0 ${
            selectedCategory === 'ALL'
              ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 font-bold shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Tất cả ({transactions.length})
        </button>
        {categories.map((cat) => {
          const count = transactions.filter((tx) => tx.category === cat.name).length;
          const isActive = selectedCategory === cat.name;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(isActive ? 'ALL' : cat.name)}
              className={`px-2.5 py-1 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                isActive
                  ? 'bg-brand text-white font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-brand/10 hover:text-brand'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color || '#6366F1' }}
              />
              <span>{cat.name}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Transaction List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 animate-pulse"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-850 rounded w-36" />
                  </div>
                </div>
                <div className="text-right space-y-1.5 flex-shrink-0">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20 ml-auto" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-850 rounded w-14 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Chưa có giao dịch nào
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Lịch sử giao dịch trong hệ thống hiện đang trống. Hãy ghi nhận khoản thu, chi hoặc chuyển khoản đầu tiên để theo dõi dòng tiền!
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAddTx}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Giao Dịch Đầu Tiên</span>
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 space-y-3">
            <p>Không tìm thấy giao dịch nào phù hợp với bộ lọc danh mục hoặc loại giao dịch.</p>
            <button
              type="button"
              onClick={() => {
                onFilterChange('ALL');
                onSelectCategory('ALL');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold hover:border-brand/40 transition-colors cursor-pointer text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-brand" />
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 hover:border-brand/40 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
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

                <div className="min-w-0">
                  <div
                    onClick={() =>
                      onSelectCategory(
                        selectedCategory === tx.category ? 'ALL' : tx.category
                      )
                    }
                    className="font-bold text-xs text-slate-800 dark:text-slate-100 hover:text-brand transition-colors cursor-pointer truncate"
                    title={`Lọc theo danh mục "${tx.category}"`}
                  >
                    {tx.category}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                    <span>{tx.date}</span>
                    <span>•</span>
                    <span className="truncate">
                      {tx.type === 'TRANSFER' ? `${tx.wallet} → ${tx.destWallet}` : tx.wallet}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                <div className="text-right">
                  <div
                    className={`text-sm font-extrabold tabular-nums ${
                      tx.type === 'INCOME'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : tx.type === 'EXPENSE'
                        ? 'text-rose-500 dark:text-rose-400'
                        : 'text-brand'
                    }`}
                  >
                    {tx.type === 'INCOME' ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[140px] sm:max-w-[200px]">{tx.note}</div>
                </div>

                {/* Actions: Edit & Delete buttons */}
                <div className="flex items-center gap-1 opacity-80 sm:opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onOpenEditTx(tx)}
                    aria-label={`Chỉnh sửa giao dịch ${tx.category}: ${formatCurrency(tx.amount)}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer focus-ring"
                    title="Chỉnh sửa giao dịch"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => onRequestDeleteTx(tx, e)}
                    aria-label={`Xóa giao dịch ${tx.category}: ${formatCurrency(tx.amount)}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer focus-ring"
                    title="Xóa giao dịch"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination && onPageChange && (
        <PaginationControl
          pagination={pagination}
          onPageChange={onPageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
