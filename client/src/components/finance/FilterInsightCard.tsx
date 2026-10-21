import React from 'react';
import {
  Sparkles,
  PieChart,
  TrendingDown,
  Receipt,
  Calculator,
  X,
  Award,
} from 'lucide-react';
import { FilterInsightStats, PeriodSummary } from './types';
import { formatCurrency } from '../../lib/utils';
import { Tooltip } from '../common/Tooltip';

interface FilterInsightCardProps {
  stats: FilterInsightStats;
  periodSummary?: PeriodSummary;
  selectedCategory?: string;
  selectedWalletName?: string;
  filterType?: 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER';
  searchQuery?: string;
  periodLabel?: string;
  onClearFilters: () => void;
}

export const FilterInsightCard: React.FC<FilterInsightCardProps> = ({
  stats,
  periodSummary,
  selectedCategory = 'ALL',
  selectedWalletName,
  filterType = 'ALL',
  searchQuery = '',
  periodLabel = 'kỳ này',
  onClearFilters,
}) => {
  const isCategoryFiltered = selectedCategory !== 'ALL';
  const isWalletFiltered = Boolean(selectedWalletName && selectedWalletName !== 'Tất cả ví');
  const isTypeFiltered = filterType !== 'ALL';
  const isSearchFiltered = Boolean(searchQuery && searchQuery.trim().length > 0);

  const hasAnyFilter = isCategoryFiltered || isWalletFiltered || isTypeFiltered || isSearchFiltered;

  // Determine active title
  let filterTitle = 'Tổng quan giao dịch';
  if (isCategoryFiltered) {
    filterTitle = `Danh mục: ${selectedCategory}`;
  } else if (isWalletFiltered) {
    filterTitle = `Ví: ${selectedWalletName}`;
  } else if (isSearchFiltered) {
    filterTitle = `Tìm kiếm: "${searchQuery}"`;
  } else if (filterType === 'EXPENSE') {
    filterTitle = 'Các khoản chi tiêu';
  } else if (filterType === 'INCOME') {
    filterTitle = 'Các khoản thu nhập';
  } else if (filterType === 'TRANSFER') {
    filterTitle = 'Chuyển tiền nội bộ';
  }

  const isExpenseContext = filterType === 'EXPENSE' || (isCategoryFiltered && stats.percentageOfPeriodExpense > 0);

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 border border-brand/20 dark:border-brand/30 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden transition-all">
      {/* Background soft glow decoration */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-brand/5 dark:bg-brand/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar: Title & Clear Filters button */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-200/60 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand/10 text-brand">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                {filterTitle}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-semibold">
                {periodLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {hasAnyFilter
                ? 'Thông số tính toán tự động trên toàn bộ giao dịch khớp với bộ lọc'
                : 'Thống kê tổng hợp số liệu giao dịch trong chu kỳ đang chọn'}
            </p>
          </div>
        </div>

        {hasAnyFilter && (
          <Tooltip content="Xóa tất cả bộ lọc và quay về xem tổng quan toàn kỳ">
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          </Tooltip>
        )}
      </div>

      {/* Grid of 4 Key Calculated Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-3.5">
        {/* Metric 1: Total Amount */}
        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
            <Receipt className="w-3.5 h-3.5 text-brand" />
            <span>Tổng số tiền</span>
          </div>
          <div
            className={`text-base sm:text-lg font-black tabular-nums tracking-tight ${
              filterType === 'INCOME'
                ? 'text-emerald-600 dark:text-emerald-400'
                : isExpenseContext
                ? 'text-rose-500 dark:text-rose-400'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {formatCurrency(stats.totalAmount)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {stats.count > 0 ? `Tính trên ${stats.count} giao dịch` : 'Chưa có giao dịch'}
          </div>
        </div>

        {/* Metric 2: Transaction Count */}
        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Tần suất / Số lần</span>
          </div>
          <div className="text-base sm:text-lg font-black tabular-nums text-slate-900 dark:text-white">
            {stats.count}{' '}
            <span className="text-xs font-semibold text-slate-500">lần phát sinh</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {stats.count === 0
              ? 'Không có giao dịch nào'
              : stats.count === 1
              ? 'Giao dịch đơn lẻ'
              : 'Nhiều khoản phát sinh'}
          </div>
        </div>

        {/* Metric 3: Budget Share / Percentage */}
        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
            <PieChart className="w-3.5 h-3.5 text-indigo-500" />
            <span>Tỷ trọng ngân sách</span>
          </div>
          <div className="text-base sm:text-lg font-black tabular-nums text-indigo-600 dark:text-indigo-400">
            {stats.percentageOfPeriodExpense > 0
              ? `${stats.percentageOfPeriodExpense}%`
              : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {stats.percentageOfPeriodExpense > 0
              ? `trên tổng chi tiêu ${periodLabel}`
              : 'Chưa đủ dữ liệu tính tỷ trọng'}
          </div>
        </div>

        {/* Metric 4: Average Amount per Transaction */}
        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            <span>Trung bình mỗi lần</span>
          </div>
          <div className="text-base sm:text-lg font-black tabular-nums text-slate-900 dark:text-white">
            {formatCurrency(stats.averageAmount)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Ước lượng định mức chi tiêu
          </div>
        </div>
      </div>

      {/* Footer Highlight: Max Single Transaction */}
      {stats.maxAmount > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="font-semibold">Khoản lớn nhất:</span>
            <span className="font-extrabold tabular-nums text-brand dark:text-brand-light">
              {formatCurrency(stats.maxAmount)}
            </span>
            {stats.maxTransactionNote && (
              <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs">
                ({stats.maxTransactionNote})
              </span>
            )}
          </div>

          {periodSummary && (
            <div className="text-slate-400 text-[11px]">
              Dòng tiền kỳ: {periodSummary.netCashflow >= 0 ? '+' : ''}
              {formatCurrency(periodSummary.netCashflow)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
