import React from 'react';
import { TrendingUp, TrendingDown, Minus, FolderTree, ArrowRightLeft, Plus } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { Tooltip, InfoTooltip } from '../common/Tooltip';

interface FinanceHeaderProps {
  totalBalance: number;
  netCashflow?: number;
  monthlyIncome?: number;
  monthlyExpense?: number;
  isLoading?: boolean;
  periodLabel?: string;
  onOpenCategoryModal: () => void;
  onOpenTransferModal: () => void;
  onOpenAddWalletModal: () => void;
}

export const FinanceHeader = React.memo<FinanceHeaderProps>(({
  totalBalance,
  netCashflow = 0,
  monthlyIncome = 0,
  monthlyExpense = 0,
  isLoading = false,
  periodLabel = 'tháng này',
  onOpenCategoryModal,
  onOpenTransferModal,
  onOpenAddWalletModal,
}) => {
  const hasMonthlyActivity = monthlyIncome > 0 || monthlyExpense > 0;
  const savingsRate =
    monthlyIncome > 0 && netCashflow > 0
      ? Math.round((netCashflow / monthlyIncome) * 100)
      : 0;

  return (
    <div className="bg-card text-card-foreground border border-border p-5 rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tài chính & Dòng tiền
          </h1>
          <InfoTooltip content="Trung tâm quản lý số dư đa ví, phân loại dòng tiền thu chi và kiểm soát tài sản cá nhân theo thời gian thực." />
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-foreground">
              {isLoading ? '…' : formatCurrency(totalBalance)}
            </span>
            <InfoTooltip content="Tổng giá trị tài sản tính bằng tổng số dư của tất cả các ví khả dụng cộng lại." />
          </div>

          {isLoading ? (
            <span className="h-6 w-28 bg-muted rounded-md animate-pulse" />
          ) : !hasMonthlyActivity ? (
            <div className="flex items-center gap-1">
              <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium flex items-center gap-1">
                <Minus className="w-3 h-3" /> 0&nbsp;₫ biến động ({periodLabel})
              </span>
            </div>
          ) : netCashflow >= 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +{formatCurrency(netCashflow)} thặng dư ({periodLabel})
              </span>
              {savingsRate > 0 && (
                <Tooltip content="Tỷ lệ tiết kiệm ròng = Thặng dư / Tổng thu nhập của chu kỳ này">
                  <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-foreground font-medium border border-border cursor-help">
                    Tiết kiệm {savingsRate}%
                  </span>
                </Tooltip>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium border border-rose-500/20 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> -{formatCurrency(Math.abs(netCashflow))} thâm hụt ({periodLabel})
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Theo dõi thu chi đa ví chuẩn ACID và kiểm soát dòng tiền theo thời gian thực.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tooltip content="Tùy biến các nhóm thu chi như Ăn uống, Tiền lương, Đầu tư, Hóa đơn…">
          <button
            type="button"
            onClick={onOpenCategoryModal}
            className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-medium text-xs transition-[background-color,border-color] flex items-center gap-1.5 cursor-pointer focus-ring"
          >
            <FolderTree className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Danh mục</span>
          </button>
        </Tooltip>

        <Tooltip content="Điều chuyển số dư qua lại giữa 2 ví (không làm thay đổi tổng tài sản).">
          <button
            type="button"
            onClick={onOpenTransferModal}
            className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-medium text-xs transition-[background-color,border-color] flex items-center gap-1.5 cursor-pointer focus-ring"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Chuyển tiền</span>
          </button>
        </Tooltip>

        <Tooltip content="Tạo thêm tài khoản ngân hàng, ví tiền mặt hoặc thẻ tín dụng mới.">
          <button
            type="button"
            onClick={onOpenAddWalletModal}
            className="px-3.5 py-1.5 rounded-lg bg-foreground hover:bg-foreground/90 text-background font-medium text-xs shadow-xs transition-[background-color,opacity] flex items-center gap-1.5 cursor-pointer focus-ring"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Thêm ví mới</span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
});

FinanceHeader.displayName = 'FinanceHeader';
