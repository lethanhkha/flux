import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Download,
  Tag,
  RotateCcw,
  Wallet as WalletIcon,
  CalendarDays,
  Settings,
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
import { CustomSelect } from '../common/CustomSelect';
import { SearchInput } from '../common/SearchInput';
import { EmptyTransactions, EmptySearch } from '../illustrations';
import { staggerContainer } from '../../lib/motionTokens';
import { PeriodSelector } from './PeriodSelector';
import { FilterInsightCard } from './FilterInsightCard';
import { TransactionRow } from './TransactionRow';

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
  onOpenCategoryModal?: () => void;
  onOpenEditTx: (tx: TransactionItem) => void;
  onRequestDeleteTx: (tx: TransactionItem, e?: React.MouseEvent) => void;
  isLoading?: boolean;
  pagination?: PaginationMeta;
  onPageChange?: (newPage: number) => void;
}

export const TransactionList = React.memo<TransactionListProps>(({
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
  onOpenCategoryModal,
  onExportCSV,
  onOpenEditTx,
  onRequestDeleteTx,
  isLoading = false,
  pagination,
  onPageChange,
}) => {
  const categoryBarRef = useRef<HTMLDivElement>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);

  // Smooth mouse-wheel horizontal scrolling for category chips
  useEffect(() => {
    const el = categoryBarRef.current;
    const container = categoryContainerRef.current;
    if (!el || !container) return;

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

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
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
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5 text-card-foreground space-y-4">
      {/* 1. Header & Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base sm:text-lg text-foreground">Lịch sử giao dịch</h2>
            {hasActiveFilters && (
              <Tooltip content="Đang áp dụng bộ lọc cho danh sách. Nhấp nút Xóa bộ lọc bên dưới để đặt lại.">
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-medium cursor-help">
                  Đang lọc
                </span>
              </Tooltip>
            )}
            <InfoTooltip content="Lịch sử mọi khoản thu, chi và chuyển khoản được tự động lọc theo chu kỳ thời gian và thống kê tức thời." />
          </div>
          <p className="text-xs text-muted-foreground">
            Theo dõi chi tiêu theo từng kỳ, gom nhóm theo ngày và tính toán tự động
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tooltip content="Thêm khoản thu nhập, chi tiêu hoặc phát sinh mới.">
            <button
              type="button"
              onClick={onOpenAddTx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-[opacity,transform] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Giao Dịch</span>
            </button>
          </Tooltip>

          <Tooltip content="Tải xuống dữ liệu giao dịch khớp với bộ lọc hiện tại dưới file CSV / Excel.">
            <button
              type="button"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-[background-color] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
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
          <SearchInput
            value={searchQuery}
            onChange={(val) => onSearchChange?.(val)}
            placeholder="Tìm kiếm nội dung, ghi chú, danh mục…"
            isLoading={isLoading}
            className="flex-1 min-w-[200px] max-w-sm"
          />

          {/* Unified Custom Wallet Selector Dropdown */}
          {wallets.length > 0 && (
            <Tooltip content="Lọc giao dịch theo từng ví hoặc tài khoản nguồn/đích">
              <CustomSelect
                value={selectedWalletId}
                onChange={(val) => onSelectWallet?.(val)}
                size="sm"
                icon={<WalletIcon className="w-3.5 h-3.5 text-muted-foreground" />}
                options={[
                  {
                    value: 'ALL',
                    label: `Tất cả ví (${wallets.length})`,
                    icon: <WalletIcon className="w-3.5 h-3.5 text-muted-foreground" />,
                  },
                  ...wallets.map((w) => ({
                    value: w.id,
                    label: w.name,
                    color: w.color,
                    badge: formatCurrency(w.balance),
                  })),
                ]}
              />
            </Tooltip>
          )}
        </div>

        {/* Right: Type Tabs (ALL, INCOME, EXPENSE, TRANSFER) */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-border/40 bg-muted text-xs font-medium self-start md:self-auto">
          <Tooltip content="Hiển thị tất cả mọi loại giao dịch">
            <button
              type="button"
              onClick={() => onFilterChange('ALL')}
              className={`px-2.5 py-1 rounded-sm transition-[color,background-color] cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-background text-foreground shadow-xs font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tất Cả
            </button>
          </Tooltip>

          <Tooltip content="Chỉ lọc các khoản thu tiền vào (+)">
            <button
              type="button"
              onClick={() => onFilterChange('INCOME')}
              className={`px-2.5 py-1 rounded-sm transition-[color,background-color] cursor-pointer ${
                filter === 'INCOME'
                  ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-xs font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Thu (+)
            </button>
          </Tooltip>

          <Tooltip content="Chỉ lọc các khoản chi tiền ra (-)">
            <button
              type="button"
              onClick={() => onFilterChange('EXPENSE')}
              className={`px-2.5 py-1 rounded-sm transition-[color,background-color] cursor-pointer ${
                filter === 'EXPENSE'
                  ? 'bg-background text-rose-500 dark:text-rose-400 shadow-xs font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Chi (-)
            </button>
          </Tooltip>

          <Tooltip content="Chỉ lọc chuyển tiền nội bộ giữa các ví (↔)">
            <button
              type="button"
              onClick={() => onFilterChange('TRANSFER')}
              className={`px-2.5 py-1 rounded-sm transition-[color,background-color] cursor-pointer ${
                filter === 'TRANSFER'
                  ? 'bg-background text-foreground shadow-xs font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Chuyển (↔)
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 4. Category Filter Chips Bar */}
      <div
        ref={categoryContainerRef}
        className="flex items-center gap-2 text-xs min-w-0"
      >
        {/* Fixed "Danh mục:" Label */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0 select-none pl-1 py-1">
          <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="whitespace-nowrap">Danh mục:</span>
        </div>

        {/* Scrollable Category Chips Container */}
        <div
          ref={categoryBarRef}
          className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto custom-scrollbar-x pb-2 pt-0.5 text-xs scroll-smooth"
        >
          <Tooltip content="Xem tất cả các danh mục giao dịch" wrapperClassName="shrink-0">
            <button
              type="button"
              onClick={() => onSelectCategory('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs transition-[color,background-color,border-color] cursor-pointer shrink-0 whitespace-nowrap border ${
                selectedCategory === 'ALL'
                  ? 'border-border bg-foreground text-background font-medium'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Tất cả ({transactions.length})
            </button>
          </Tooltip>
          {categories.map((cat) => {
            const count = transactions.filter((tx) => tx.category === cat.name).length;
            const isActive = selectedCategory === cat.name;
            return (
              <Tooltip
                key={cat.id}
                content={`Lọc các khoản thuộc danh mục "${cat.name}"`}
                wrapperClassName="shrink-0"
              >
                <button
                  type="button"
                  onClick={() => onSelectCategory(isActive ? 'ALL' : cat.name)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-[color,background-color,border-color] flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap border ${
                    isActive
                      ? 'border-border bg-foreground text-background font-medium'
                      : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || 'hsl(var(--foreground))' }}
                  />
                  <span className="whitespace-nowrap">{cat.name}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 font-medium ${
                        isActive
                          ? 'bg-background/20 text-background'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>

        {/* Fixed Right Button: Quản Lý Danh Mục */}
        {onOpenCategoryModal && (
          <Tooltip content="Quản lý đổi tên, màu sắc hoặc thêm bớt danh mục thu chi" wrapperClassName="shrink-0">
            <button
              type="button"
              onClick={onOpenCategoryModal}
              className="px-2.5 py-1 rounded-md text-xs border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-[color,border-color] flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Settings className="w-3 h-3" />
              <span>Quản Lý Danh Mục</span>
            </button>
          </Tooltip>
        )}
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
                className="p-3.5 rounded-lg bg-card border border-border flex items-center justify-between gap-4 animate-pulse"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-md bg-muted flex-shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 bg-muted rounded w-28" />
                    <div className="h-2.5 bg-muted/60 rounded w-36" />
                  </div>
                </div>
                <div className="text-right space-y-1.5 flex-shrink-0">
                  <div className="h-4 bg-muted rounded w-20 ml-auto" />
                  <div className="h-2.5 bg-muted/60 rounded w-14 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-lg border border-dashed border-border flex flex-col items-center justify-center space-y-3">
            <EmptyTransactions width={150} height={120} />
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                Chưa có giao dịch trong {periodLabel}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Không ghi nhận giao dịch thu chi nào trong khoảng thời gian này.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAddTx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-[opacity,transform] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ghi Nhận Giao Dịch</span>
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-lg border border-dashed border-border text-xs text-muted-foreground space-y-3">
            <EmptySearch width={120} height={90} />
            <p>Không tìm thấy giao dịch nào khớp với bộ lọc hoặc từ khóa tìm kiếm.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-muted text-foreground font-medium text-xs transition-[background-color] cursor-pointer"
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
                      <Tooltip content={`Tổng chi tiêu trong ngày ${group.displayDate}`}>
                        <span className="text-rose-500 tabular-nums cursor-help">
                          Chi: -{formatCurrency(group.totalExpense)}
                        </span>
                      </Tooltip>
                    )}
                    {group.totalIncome > 0 && (
                      <Tooltip content={`Tổng thu nhập trong ngày ${group.displayDate}`}>
                        <span className="text-emerald-600 dark:text-emerald-400 tabular-nums cursor-help">
                          Thu: +{formatCurrency(group.totalIncome)}
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {/* Day Items */}
                <div className="space-y-2">
                  {group.items.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      selectedCategory={selectedCategory}
                      selectedWalletId={selectedWalletId}
                      onSelectCategory={onSelectCategory}
                      onSelectWallet={onSelectWallet}
                      onOpenEditTx={onOpenEditTx}
                      onRequestDeleteTx={onRequestDeleteTx}
                    />
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
});

TransactionList.displayName = 'TransactionList';
