import React from 'react';
import {
  Sparkles,
  PieChart,
  TrendingDown,
  Receipt,
  Calculator,
  X,
  Award,
  Wallet,
} from 'lucide-react';
import { FilterInsightStats, PeriodSummary } from './types';
import { formatCurrency, cn } from '../../lib/utils';
import { Tooltip, InfoTooltip } from '../common/Tooltip';

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
              <Tooltip content="Khoảng thời gian đang áp dụng cho số liệu thống kê bên dưới">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-semibold cursor-help">
                  {periodLabel}
                </span>
              </Tooltip>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {hasAnyFilter
                ? 'Thông số tính toán tự động trên toàn bộ giao dịch khớp với bộ lọc'
                : 'Thống kê tổng hợp số liệu thu chi trong chu kỳ đang chọn'}
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
        {/* Metric 1: Total Amount (Category Mode) OR Total Income & Expense (Period Mode) */}
        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-brand" />
              <span>
                {isCategoryFiltered
                  ? filterType === 'INCOME'
                    ? 'Tổng thu danh mục'
                    : 'Tổng chi danh mục'
                  : 'Tổng Thu & Tổng Chi'}
              </span>
            </div>
            <InfoTooltip
              content={
                isCategoryFiltered
                  ? `Tổng số tiền phát sinh của riêng danh mục "${selectedCategory}" trong ${periodLabel}.`
                  : `Tổng hợp dòng tiền thu nhập (+) và chi tiêu (-) ghi nhận trong ${periodLabel}.`
              }
            />
          </div>

          {isCategoryFiltered ? (
            <div>
              <div
                className={`text-base sm:text-lg font-black tabular-nums tracking-tight ${
                  filterType === 'INCOME'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-500 dark:text-rose-400'
                }`}
              >
                {filterType === 'INCOME' ? '+' : '-'}
                {formatCurrency(stats.totalAmount)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {stats.count > 0 ? `Tính trên ${stats.count} giao dịch` : 'Chưa có giao dịch'}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Thu:
                </span>
                <span>+{formatCurrency(periodSummary?.income ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-black tabular-nums text-rose-500 dark:text-rose-400">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Chi:
                </span>
                <span>-{formatCurrency(periodSummary?.expense ?? 0)}</span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>Ròng:</span>
                <span
                  className={cn(
                    'font-bold tabular-nums',
                    (periodSummary?.netCashflow ?? 0) >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-500 dark:text-rose-400'
                  )}
                >
                  {(periodSummary?.netCashflow ?? 0) >= 0 ? '+' : ''}
                  {formatCurrency(periodSummary?.netCashflow ?? 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Metric 2: Transaction Count */}
        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Tần suất / Số lần</span>
              </div>
              <InfoTooltip content="Tổng số lượt giao dịch ghi nhận tương ứng với tiêu chí lọc." />
            </div>
            <div className="text-base sm:text-lg font-black tabular-nums text-slate-900 dark:text-white">
              {stats.count}{' '}
              <span className="text-xs font-semibold text-slate-500">lần phát sinh</span>
            </div>
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
        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <PieChart className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isCategoryFiltered ? 'Tỷ trọng ngân sách' : 'Tỷ lệ tiết kiệm'}</span>
              </div>
              <InfoTooltip
                content={
                  isCategoryFiltered
                    ? `Tỷ lệ phần trăm tổng chi của danh mục "${selectedCategory}" so với toàn bộ chi tiêu trong ${periodLabel}.`
                    : `Tỷ lệ phần trăm tiết kiệm ròng = Thặng dư / Tổng thu nhập của ${periodLabel}.`
                }
              />
            </div>
            <div className="text-base sm:text-lg font-black tabular-nums text-indigo-600 dark:text-indigo-400">
              {isCategoryFiltered
                ? stats.percentageOfPeriodExpense > 0
                  ? `${stats.percentageOfPeriodExpense}%`
                  : '—'
                : periodSummary && periodSummary.income > 0 && periodSummary.netCashflow > 0
                ? `${Math.round((periodSummary.netCashflow / periodSummary.income) * 100)}%`
                : '—'}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isCategoryFiltered
              ? stats.percentageOfPeriodExpense > 0
                ? `trên tổng chi tiêu ${periodLabel}`
                : 'Chưa đủ dữ liệu tính tỷ trọng'
              : periodSummary && periodSummary.income > 0 && periodSummary.netCashflow > 0
              ? `tiết kiệm được từ thu nhập ${periodLabel}`
              : 'Chưa có thặng dư tiết kiệm'}
          </div>
        </div>

        {/* Metric 4: Average Amount per Transaction */}
        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                <span>Trung bình mỗi lần</span>
              </div>
              <InfoTooltip content="Số tiền chi tiêu hoặc thu nhập bình quân trên mỗi lượt giao dịch phát sinh." />
            </div>
            <div className="text-base sm:text-lg font-black tabular-nums text-slate-900 dark:text-white">
              {formatCurrency(stats.averageAmount)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Ước lượng định mức chi tiêu
          </div>
        </div>
      </div>

      {/* Footer Highlight: Max Single Transaction */}
      {stats.maxAmount > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <Tooltip content="Giao dịch có giá trị phát sinh cao nhất trong nhóm đang lọc">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 cursor-help">
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
          </Tooltip>

          {periodSummary && (
            <Tooltip content="Chênh lệch ròng giữa Tổng thu và Tổng chi trong toàn bộ kỳ này">
              <div className="text-slate-400 text-[11px] cursor-help flex items-center gap-1">
                <Wallet className="w-3 h-3 text-brand" />
                <span>Dòng tiền kỳ:</span>
                <span
                  className={cn(
                    'font-bold tabular-nums',
                    periodSummary.netCashflow >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-500 dark:text-rose-400'
                  )}
                >
                  {periodSummary.netCashflow >= 0 ? '+' : ''}
                  {formatCurrency(periodSummary.netCashflow)}
                </span>
              </div>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
};
