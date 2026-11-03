import React from 'react';
import {
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
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      {/* Header bar: Title & Clear Filters button */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md border border-border bg-muted text-foreground">
            <Calculator className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">
                {filterTitle}
              </span>
              <Tooltip content="Khoảng thời gian đang áp dụng cho số liệu thống kê bên dưới">
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-medium cursor-help">
                  {periodLabel}
                </span>
              </Tooltip>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {hasAnyFilter
                ? 'Thông số tính toán trên các giao dịch khớp bộ lọc'
                : 'Thống kê tổng hợp số liệu thu chi trong chu kỳ đang chọn'}
            </p>
          </div>
        </div>

        {hasAnyFilter && (
          <Tooltip content="Xóa tất cả bộ lọc và quay về xem tổng quan toàn kỳ">
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-secondary hover:bg-muted text-foreground text-xs font-medium transition-[background-color] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          </Tooltip>
        )}
      </div>

      {/* Grid of 4 Key Calculated Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-3.5 divide-y lg:divide-y-0 lg:divide-x divide-border/40">
        {/* Metric 1: Total Amount (Category Mode) OR Total Income & Expense (Period Mode) */}
        <div className="flex flex-col justify-between pr-2">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" />
              <span>
                {isCategoryFiltered
                  ? filterType === 'INCOME'
                    ? 'Tổng thu danh mục'
                    : 'Tổng chi danh mục'
                  : 'Tổng Thu & Chi'}
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
                className={`text-base sm:text-lg font-bold tabular-nums tracking-tight ${
                  filterType === 'INCOME'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-500 dark:text-rose-400'
                }`}
              >
                {filterType === 'INCOME' ? '+' : '-'}
                {formatCurrency(stats.totalAmount)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {stats.count > 0 ? `Tính trên ${stats.count} giao dịch` : 'Chưa có giao dịch'}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                <span className="text-[10px] font-medium text-muted-foreground">Thu:</span>
                <span>+{formatCurrency(periodSummary?.income ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold tabular-nums text-rose-500 dark:text-rose-400">
                <span className="text-[10px] font-medium text-muted-foreground">Chi:</span>
                <span>-{formatCurrency(periodSummary?.expense ?? 0)}</span>
              </div>
              <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/40 flex items-center justify-between">
                <span>Ròng:</span>
                <span
                  className={cn(
                    'font-medium tabular-nums',
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
        <div className="flex flex-col justify-between pt-3 lg:pt-0 lg:px-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <span>Số lần phát sinh</span>
              </div>
              <InfoTooltip content="Tổng số lượt giao dịch ghi nhận tương ứng với tiêu chí lọc." />
            </div>
            <div className="text-base sm:text-lg font-bold tabular-nums tracking-tight text-foreground">
              {stats.count}{' '}
              <span className="text-xs font-normal text-muted-foreground">lần</span>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {stats.count === 0
              ? 'Không có giao dịch'
              : stats.count === 1
              ? 'Giao dịch đơn lẻ'
              : 'Nhiều khoản phát sinh'}
          </div>
        </div>

        {/* Metric 3: Budget Share / Percentage */}
        <div className="flex flex-col justify-between pt-3 lg:pt-0 lg:px-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <PieChart className="w-3.5 h-3.5" />
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
            <div className="text-base sm:text-lg font-bold tabular-nums tracking-tight text-foreground">
              {isCategoryFiltered
                ? stats.percentageOfPeriodExpense > 0
                  ? `${stats.percentageOfPeriodExpense}%`
                  : '—'
                : periodSummary && periodSummary.income > 0 && periodSummary.netCashflow > 0
                ? `${Math.round((periodSummary.netCashflow / periodSummary.income) * 100)}%`
                : '—'}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {isCategoryFiltered
              ? stats.percentageOfPeriodExpense > 0
                ? `trên tổng chi tiêu ${periodLabel}`
                : 'Chưa đủ dữ liệu tính tỷ trọng'
              : periodSummary && periodSummary.income > 0 && periodSummary.netCashflow > 0
              ? `tiết kiệm từ thu nhập ${periodLabel}`
              : 'Chưa có thặng dư tiết kiệm'}
          </div>
        </div>

        {/* Metric 4: Average Amount per Transaction */}
        <div className="flex flex-col justify-between pt-3 lg:pt-0 lg:pl-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Bình quân mỗi lần</span>
              </div>
              <InfoTooltip content="Số tiền chi tiêu hoặc thu nhập bình quân trên mỗi lượt giao dịch phát sinh." />
            </div>
            <div className="text-base sm:text-lg font-bold tabular-nums tracking-tight text-foreground">
              {formatCurrency(stats.averageAmount)}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Định mức trung bình mỗi giao dịch
          </div>
        </div>
      </div>

      {/* Footer Highlight: Max Single Transaction */}
      {stats.maxAmount > 0 && (
        <div className="mt-3 pt-2.5 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <Tooltip content="Giao dịch có giá trị phát sinh cao nhất trong nhóm đang lọc">
            <div className="flex items-center gap-1.5 text-muted-foreground cursor-help">
              <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="font-medium text-foreground">Khoản lớn nhất:</span>
              <span className="font-bold tabular-nums text-foreground">
                {formatCurrency(stats.maxAmount)}
              </span>
              {stats.maxTransactionNote && (
                <span className="text-muted-foreground truncate max-w-xs">
                  ({stats.maxTransactionNote})
                </span>
              )}
            </div>
          </Tooltip>

          {periodSummary && (
            <Tooltip content="Chênh lệch ròng giữa Tổng thu và Tổng chi trong toàn bộ kỳ này">
              <div className="text-muted-foreground text-[11px] cursor-help flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                <span>Dòng tiền kỳ:</span>
                <span
                  className={cn(
                    'font-medium tabular-nums',
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
