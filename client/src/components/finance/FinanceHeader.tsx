import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, FolderTree, ArrowRightLeft, Plus } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { Tooltip, InfoTooltip } from '../common/Tooltip';

interface FinanceHeaderProps {
  totalBalance: number;
  netCashflow?: number;
  monthlyIncome?: number;
  monthlyExpense?: number;
  isLoading?: boolean;
  onOpenCategoryModal: () => void;
  onOpenTransferModal: () => void;
  onOpenAddWalletModal: () => void;
}

export const FinanceHeader: React.FC<FinanceHeaderProps> = ({
  totalBalance,
  netCashflow = 0,
  monthlyIncome = 0,
  monthlyExpense = 0,
  isLoading = false,
  onOpenCategoryModal,
  onOpenTransferModal,
  onOpenAddWalletModal,
}) => {
  const hasMonthlyActivity = monthlyIncome > 0 || monthlyExpense > 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tự Do Tài Chính & Kiến Tạo Tương Lai</span>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dòng Tiền & Tự Do Tài Chính
          </h1>
          <InfoTooltip content="Trung tâm quản lý số dư đa ví, phân loại dòng tiền thu chi và kiểm soát tài sản cá nhân theo thời gian thực." />
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-brand dark:text-brand-light">
              {isLoading ? '...' : formatCurrency(totalBalance)}
            </span>
            <InfoTooltip content="Tổng giá trị tài sản tính bằng tổng số dư của tất cả các ví khả dụng cộng lại." />
          </div>

          {isLoading ? (
            <span className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
          ) : !hasMonthlyActivity ? (
            <div className="flex items-center gap-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                <Minus className="w-3 h-3" /> 0 ₫ biến động tháng này
              </span>
              <InfoTooltip content="Chưa ghi nhận biến động thu chi nào trong tháng hiện tại." />
            </div>
          ) : netCashflow >= 0 ? (
            <div className="flex items-center gap-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +{formatCurrency(netCashflow)} thặng dư tháng này
              </span>
              <InfoTooltip content="Chênh lệch ròng dương giữa tổng Thu nhập và Chi tiêu trong tháng này (Thu > Chi)." />
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 dark:text-rose-400 font-bold flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> -{formatCurrency(Math.abs(netCashflow))} thâm hụt tháng này
              </span>
              <InfoTooltip content="Chênh lệch ròng âm giữa tổng Thu nhập và Chi tiêu trong tháng này (Chi > Thu)." />
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Làm chủ thu chi đa ví, thiết lập quỹ dự phòng và kiểm soát danh mục tài sản theo thời gian thực
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Tooltip content="Tùy biến các nhóm thu chi như Ăn uống, Tiền lương, Đầu tư, Hóa đơn...">
          <button
            type="button"
            onClick={onOpenCategoryModal}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FolderTree className="w-4 h-4 text-brand" />
            <span>Quản Lý Danh Mục</span>
          </button>
        </Tooltip>

        <Tooltip content="Điều chuyển số dư qua lại giữa 2 ví (không làm thay đổi tổng tài sản).">
          <button
            type="button"
            onClick={onOpenTransferModal}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-brand/40 text-slate-800 dark:text-slate-100 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-brand" />
            <span>Chuyển Tiền</span>
          </button>
        </Tooltip>

        <Tooltip content="Tạo thêm tài khoản ngân hàng, ví tiền mặt hoặc thẻ tín dụng mới.">
          <button
            type="button"
            onClick={onOpenAddWalletModal}
            className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Ví Mới</span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
