import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Download,
  Tag,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Edit3,
  Trash2,
  RotateCcw,
  Search,
  Wallet as WalletIcon,
  X,
  CalendarDays,
} from 'lucide-react';
import {
  TransactionItem,
  CategoryItem,
  WalletItem,
  PeriodFilter,
  PeriodSummary,
  FilterInsightStats,
} from './types';
import { formatCurrency } from '../../lib/utils';
import { PaginationControl, PaginationMeta } from '../common/PaginationControl';
import { Tooltip, InfoTooltip } from '../common/Tooltip';
import { EmptyTransactions, EmptySearch } from '../illustrations';
import { staggerContainer, staggerItem } from '../../lib/motionTokens';
import { PeriodSelector } from './PeriodSelector';
import { FilterInsightCard } from './FilterInsightCard';

interface TransactionListProps {
  transactions: TransactionItem[];
  filteredTransactions: TransactionItem[];
  categories: CategoryItem[];
  wallets?: WalletItem[];
  filter: 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER';
  onFilterChange: (filter: 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER') => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedWalletId?: string;
  onSelectWallet?: (walletId: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  period: PeriodFilter;
  onPeriodChange: (p: PeriodFilter) => void;
  periodSummary?: PeriodSummary;
  filteredStats?: FilterInsightStats;
  periodLabel?: string;
  onClearAllFilters?: () => void;
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
  wallets = [],
  filter,
  onFilterChange,
  selectedCategory,
  onSelectCategory,
  selectedWalletId = 'ALL',
  onSelectWallet,
  searchQuery = '',
  onSearchChange,
  period,
  onPeriodChange,
  periodSummary,
  filteredStats,
  periodLabel = 'kỳ này',
  onClearAllFilters,
  onOpenAddTx,
  onExportCSV,
  onOpenEditTx,
  onRequestDeleteTx,
  isLoading = false,
  pagination,
  onPageChange,
}) => {
  const categoryBarRef = useRef<HTMLDivElement>(null);

  // Smooth mouse-wheel horizontal scrolling for category chips
  useEffect(() => {
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

  // Compute active wallet name for insights
  const selectedWalletName = useMemo(() => {
    if (!selectedWalletId || selectedWalletId === 'ALL') return undefined;
    return wallets.find((w) => w.id === selectedWalletId)?.name;
  }, [selectedWalletId, wallets]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: {
      [key: string]: {
        dateKey: string;
        displayDate: string;
        dayOfWeek?: string;
        totalIncome: number;
        totalExpense: number;
        items: TransactionItem[];
      };
    } = {};

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    const DAYS_OF_WEEK = [
      'Chủ Nhật',
      'Thứ Hai',
      'Thứ Ba',
      'Thứ Tư',
      'Thứ Năm',
      'Thứ Sáu',
      'Thứ Bảy',
    ];

    filteredTransactions.forEach((tx) => {
      const dateKey = tx.rawDate || tx.date;

      if (!groups[dateKey]) {
        let displayDate = tx.date;
        let dayOfWeek = '';

        if (tx.rawDate) {
          const d = new Date(tx.rawDate);
          if (!isNaN(d.getTime())) {
            dayOfWeek = DAYS_OF_WEEK[d.getDay()];
            if (tx.rawDate === todayStr) {
              displayDate = `Hôm nay - ${tx.date}`;
            } else if (tx.rawDate === yesterdayStr) {
              displayDate = `Hôm qua - ${tx.date}`;
            } else {
              displayDate = `${dayOfWeek}, ${tx.date}`;
            }
          }
        }

        groups[dateKey] = {
          dateKey,
          displayDate,
          dayOfWeek,
          totalIncome: 0,
          totalExpense: 0,
          items: [],
        };
      }

      groups[dateKey].items.push(tx);
      if (tx.type === 'INCOME') {
        groups[dateKey].totalIncome += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        groups[dateKey].totalExpense += tx.amount;
      }
    });

    return Object.values(groups);
  }, [filteredTransactions]);

  // Check if any filter is active
  const hasActiveFilters =
    filter !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    (selectedWalletId && selectedWalletId !== 'ALL') ||
    Boolean(searchQuery && searchQuery.trim().length > 0);

  const handleResetFilters = () => {
    if (onClearAllFilters) {
      onClearAllFilters();
    } else {
      onFilterChange('ALL');
      onSelectCategory('ALL');
      onSelectWallet?.('ALL');
      onSearchChange?.('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* 1. Header & Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base sm:text-lg">Lịch Sử Giao Dịch</h2>
            {hasActiveFilters && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-bold">
                Đang lọc
              </span>
            )}
            <InfoTooltip content="Lịch sử mọi khoản thu, chi và chuyển khoản được tự động lọc theo chu kỳ thời gian và thống kê tức thời." />
          </div>
          <p className="text-xs text-slate-500">
            Theo dõi chi tiêu theo từng tháng, gom nhóm theo ngày và tính toán tự động
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tooltip content="Thêm khoản thu nhập, chi tiêu hoặc phát sinh mới.">
            <button
              type="button"
              onClick={onOpenAddTx}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-all cursor-pointer hover:scale-102 active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Giao Dịch</span>
            </button>
          </Tooltip>

          <Tooltip content="Tải xuống dữ liệu giao dịch khớp với bộ lọc hiện tại dưới file CSV / Excel.">
            <button
              type="button"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-brand/40 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-brand" />
              <span>Xuất CSV</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 2. Period Selector: Stepper & Month / Range Switcher */}
      <PeriodSelector
        period={period}
        onChange={onPeriodChange}
        isLoading={isLoading}
      />

      {/* 3. Multi-Criteria Filter Bar: Search, Type Tabs, Wallet Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Left: Search Bar & Wallet Selector */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung, ghi chú, danh mục..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-8.5 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-brand transition-colors font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Wallet Selector Dropdown */}
          {wallets.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs shadow-2xs">
              <WalletIcon className="w-3.5 h-3.5 text-brand" />
              <select
                value={selectedWalletId}
                onChange={(e) => onSelectWallet?.(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">Tất cả ví ({wallets.length})</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Type Tabs (ALL, INCOME, EXPENSE, TRANSFER) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold self-start md:self-auto">
          <Tooltip content="Hiển thị tất cả mọi loại giao dịch">
            <button
              type="button"
              onClick={() => onFilterChange('ALL')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-brand shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tất Cả
            </button>
          </Tooltip>

          <Tooltip content="Chỉ lọc các khoản thu tiền vào (+)">
            <button
              type="button"
              onClick={() => onFilterChange('INCOME')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'INCOME'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Thu (+)
            </button>
          </Tooltip>

          <Tooltip content="Chỉ lọc các khoản chi tiền ra (-)">
            <button
              type="button"
              onClick={() => onFilterChange('EXPENSE')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'EXPENSE'
                  ? 'bg-white dark:bg-slate-900 text-rose-500 dark:text-rose-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Chi (-)
            </button>
          </Tooltip>

          <Tooltip content="Chỉ lọc chuyển tiền nội bộ giữa các ví (↔)">
            <button
              type="button"
              onClick={() => onFilterChange('TRANSFER')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'TRANSFER'
                  ? 'bg-white dark:bg-slate-900 text-brand shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Chuyển (↔)
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 4. Category Filter Chips Bar */}
      <div
        ref={categoryBarRef}
        className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar-x pb-2 pt-0.5 text-xs scroll-smooth"
      >
        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 pl-1 flex-shrink-0">
          <Tag className="w-3.5 h-3.5 text-brand" /> Danh mục:
        </span>
        <button
          type="button"
          onClick={() => onSelectCategory('ALL')}
          className={`px-3 py-1 rounded-xl text-xs transition-all cursor-pointer flex-shrink-0 ${
            selectedCategory === 'ALL'
              ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs'
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
                  ? 'bg-brand text-white font-bold shadow-xs'
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

      {/* 5. Smart Filter Insights Card */}
      {filteredStats && (
        <FilterInsightCard
          stats={filteredStats}
          periodSummary={periodSummary}
          selectedCategory={selectedCategory}
          selectedWalletName={selectedWalletName}
          filterType={filter}
          searchQuery={searchQuery}
          periodLabel={periodLabel}
          onClearFilters={handleResetFilters}
        />
      )}

      {/* 6. Date-Grouped Transaction List */}
      <div className="space-y-4 pt-1">
        {isLoading ? (
          <div className="space-y-3">
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
          <div className="p-10 text-center bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
            <EmptyTransactions width={170} height={135} />
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Chưa có giao dịch nào trong {periodLabel}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Không ghi nhận giao dịch thu chi nào trong khoảng thời gian này. Hãy thêm giao dịch mới để bắt đầu theo dõi!
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAddTx}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ghi Nhận Giao Dịch Ngay</span>
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 space-y-3">
            <EmptySearch width={130} height={100} />
            <p>Không tìm thấy giao dịch nào khớp với bộ lọc hoặc từ khóa tìm kiếm.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-brand font-semibold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-5"
          >
            {groupedTransactions.map((group) => (
              <div key={group.dateKey} className="space-y-2">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <CalendarDays className="w-3.5 h-3.5 text-brand" />
                    <span>{group.displayDate}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] font-semibold">
                    {group.totalExpense > 0 && (
                      <span className="text-rose-500 tabular-nums">
                        Chi: -{formatCurrency(group.totalExpense)}
                      </span>
                    )}
                    {group.totalIncome > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                        Thu: +{formatCurrency(group.totalIncome)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Items */}
                <div className="space-y-2">
                  {group.items.map((tx) => (
                    <motion.div
                      key={tx.id}
                      variants={staggerItem}
                      layout
                      whileHover={{ y: -1 }}
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
                            title={`Lọc nhanh theo danh mục "${tx.category}"`}
                          >
                            {tx.category}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                            <span>{tx.date}</span>
                            <span>•</span>
                            <span
                              onClick={() => {
                                if (tx.walletId && onSelectWallet) {
                                  onSelectWallet(
                                    selectedWalletId === tx.walletId ? 'ALL' : tx.walletId
                                  );
                                }
                              }}
                              className="truncate hover:text-brand cursor-pointer"
                              title="Lọc theo ví này"
                            >
                              {tx.type === 'TRANSFER'
                                ? `${tx.wallet} → ${tx.destWallet}`
                                : tx.wallet}
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
                            {tx.type === 'INCOME'
                              ? `+${formatCurrency(tx.amount)}`
                              : `-${formatCurrency(tx.amount)}`}
                          </div>
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
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
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
