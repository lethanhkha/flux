import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { apiClient, getErrorMessage } from '../api/client';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { useDebounce } from '../hooks/useDebounce';

import {
  WalletItem,
  TransactionItem,
  CategoryItem,
  DeleteModalState,
  FinanceHeader,
  WalletList,
  TransactionList,
  TransferModal,
  AddWalletModal,
  EditWalletModal,
  AddTransactionModal,
  EditTransactionModal,
  CategoryModal,
  PeriodFilter,
  FilterInsightStats,
  PeriodSummary,
  resolveWalletTypeAndIcon,
} from '../components/finance';
import { PaginationMeta } from '../components/common/PaginationControl';

export const FinancePage: React.FC = () => {
  const now = new Date();
  const [period, setPeriod] = useState<PeriodFilter>({
    mode: 'MONTH',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Modals visibility state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState(false);
  const [isEditWalletModalOpen, setIsEditWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletItem | null>(null);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionItem | null>(null);

  const [categories, setCategories] = useState<CategoryItem[]>([
    { id: 'c1', name: 'Ăn uống & Cafe', type: 'EXPENSE', color: '#F97316' },
    { id: 'c2', name: 'Mua sắm & Tiêu dùng', type: 'EXPENSE', color: '#EC4899' },
    { id: 'c3', name: 'Di chuyển & Xăng xe', type: 'EXPENSE', color: '#3B82F6' },
    { id: 'c4', name: 'Tiền nhà & Hóa đơn', type: 'EXPENSE', color: '#EF4444' },
    { id: 'c5', name: 'Giải trí & Du lịch', type: 'EXPENSE', color: '#8B5CF6' },
    { id: 'c6', name: 'Lương & Thưởng', type: 'INCOME', color: '#10B981' },
    { id: 'c7', name: 'Lợi nhuận đầu tư', type: 'INCOME', color: '#06B6D4' },
    { id: 'c8', name: 'Kinh doanh & Dự án', type: 'INCOME', color: '#6366F1' },
    { id: 'c9', name: 'Khác', type: 'EXPENSE', color: '#64748B' },
  ]);

  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isTxLoading, setIsTxLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState({
    monthlyIncome: 0,
    monthlyExpense: 0,
    netCashflow: 0,
  });

  const [periodSummary, setPeriodSummary] = useState<PeriodSummary>({
    income: 0,
    expense: 0,
    netCashflow: 0,
  });

  const [filteredStats, setFilteredStats] = useState<FilterInsightStats>({
    totalAmount: 0,
    count: 0,
    averageAmount: 0,
    maxAmount: 0,
    percentageOfPeriodExpense: 0,
  });

  const [txPagination, setTxPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  // Modern Delete Confirmation State
  const [deleteModalState, setDeleteModalState] = useState<DeleteModalState>({
    isOpen: false,
    type: null,
    isLoading: false,
  });

  // Friendly human readable period label
  const periodLabel = useMemo(() => {
    if (period.mode === 'ALL') return 'toàn thời gian';
    if (period.mode === 'RANGE') {
      if (period.startDate && period.endDate) {
        return `${period.startDate} → ${period.endDate}`;
      }
      return 'khoảng ngày tùy chọn';
    }
    return `Tháng ${period.month}/${period.year}`;
  }, [period]);

  // Fetch transactions with full server-side filters and DB-level stats
  const fetchTransactions = useCallback(async (
    page = 1,
    currentPeriod = period,
    currentFilter = filter,
    currentCategory = selectedCategory,
    currentWallet = selectedWalletId,
    currentSearch = debouncedSearch
  ) => {
    try {
      setIsTxLoading(true);
      const params: Record<string, any> = {
        page,
        limit: 20,
      };

      if (currentPeriod.mode === 'MONTH') {
        params.month = currentPeriod.month;
        params.year = currentPeriod.year;
      } else if (currentPeriod.mode === 'RANGE') {
        if (currentPeriod.startDate) params.startDate = currentPeriod.startDate;
        if (currentPeriod.endDate) params.endDate = currentPeriod.endDate;
      } else if (currentPeriod.mode === 'ALL') {
        params.allTime = 'true';
      }

      if (currentFilter !== 'ALL') {
        params.type = currentFilter;
      }
      if (currentCategory !== 'ALL') {
        params.category = currentCategory;
      }
      if (currentWallet !== 'ALL') {
        params.walletId = currentWallet;
      }
      if (currentSearch.trim()) {
        params.search = currentSearch.trim();
      }

      const res = await apiClient.get('/finance/transactions', { params });
      const rawData = res.data?.data;
      const items = rawData?.items || (Array.isArray(rawData) ? rawData : []);

      setTransactions(
        items.map((tx: any) => ({
          id: tx.id,
          type: tx.type,
          wallet: tx.wallet?.name || 'Ví',
          walletId: tx.walletId,
          destWallet: tx.destinationWallet?.name,
          destWalletId: tx.destinationWalletId,
          category: tx.category,
          amount: parseFloat(tx.amount) || 0,
          date: new Date(tx.transactionDate).toLocaleDateString('vi-VN'),
          rawDate: tx.transactionDate ? new Date(tx.transactionDate).toISOString().slice(0, 10) : undefined,
          note: tx.note || '',
        }))
      );

      if (rawData?.pagination) {
        setTxPagination(rawData.pagination);
      }

      if (rawData?.filteredStats) {
        setFilteredStats(rawData.filteredStats);
      }

      if (rawData?.periodSummary) {
        setPeriodSummary(rawData.periodSummary);
        setSummary((prev) => {
          if (
            prev.monthlyIncome === rawData.periodSummary.income &&
            prev.monthlyExpense === rawData.periodSummary.expense &&
            prev.netCashflow === rawData.periodSummary.netCashflow
          ) {
            return prev;
          }
          return {
            monthlyIncome: rawData.periodSummary.income,
            monthlyExpense: rawData.periodSummary.expense,
            netCashflow: rawData.periodSummary.netCashflow,
          };
        });
      }
    } catch {
      // Degrade gracefully
    } finally {
      setIsTxLoading(false);
    }
  }, [period, filter, selectedCategory, selectedWalletId, debouncedSearch]);

  // Consolidated Initial Load: Fetches wallets, categories, summary, and default monthly transactions
  const fetchFinanceData = async (page = 1) => {
    try {
      setIsInitialLoading(true);
      setIsTxLoading(true);
      const params: Record<string, any> = {
        page,
        limit: 20,
      };
      if (period.mode === 'MONTH') {
        params.month = period.month;
        params.year = period.year;
      }

      const res = await apiClient.get('/finance/overview', { params });
      const { wallets: rawWallets, categories: rawCategories, summary: rawSummary, transactions: rawTx } =
        res.data?.data || {};

      if (Array.isArray(rawWallets)) {
        setWallets(
          rawWallets.map((w: any) => {
            const { type, icon } = resolveWalletTypeAndIcon(w.icon, w.name);
            return {
              id: w.id,
              name: w.name,
              balance: parseFloat(w.currentBalance) || 0,
              type,
              color: w.color || '#6366F1',
              icon,
              isDefault: Boolean(w.isDefault),
            };
          })
        );
      }

      if (rawTx) {
        const items = rawTx.items || (Array.isArray(rawTx) ? rawTx : []);
        setTransactions(
          items.map((tx: any) => ({
            id: tx.id,
            type: tx.type,
            wallet: tx.wallet?.name || 'Ví',
            walletId: tx.walletId,
            destWallet: tx.destinationWallet?.name,
            destWalletId: tx.destinationWalletId,
            category: tx.category,
            amount: parseFloat(tx.amount) || 0,
            date: new Date(tx.transactionDate).toLocaleDateString('vi-VN'),
            rawDate: tx.transactionDate ? new Date(tx.transactionDate).toISOString().slice(0, 10) : undefined,
            note: tx.note || '',
          }))
        );

        if (rawTx.pagination) {
          setTxPagination(rawTx.pagination);
        }
        if (rawTx.filteredStats) {
          setFilteredStats(rawTx.filteredStats);
        }
        if (rawTx.periodSummary) {
          setPeriodSummary(rawTx.periodSummary);
          setSummary({
            monthlyIncome: rawTx.periodSummary.income,
            monthlyExpense: rawTx.periodSummary.expense,
            netCashflow: rawTx.periodSummary.netCashflow,
          });
        }
      }

      if (Array.isArray(rawCategories)) {
        setCategories(rawCategories);
      }

      if (rawSummary && !rawTx?.periodSummary) {
        setSummary({
          monthlyIncome: Number(rawSummary.monthlyIncome) || 0,
          monthlyExpense: Number(rawSummary.monthlyExpense) || 0,
          netCashflow: Number(rawSummary.netCashflow) || 0,
        });
      }
    } catch {
      // Degrade gracefully
    } finally {
      setIsInitialLoading(false);
      setIsTxLoading(false);
    }
  };

  const currentParamsRef = useRef({
    page: txPagination.page,
    period,
    filter,
    selectedCategory,
    selectedWalletId,
    debouncedSearch,
  });

  useEffect(() => {
    currentParamsRef.current = {
      page: txPagination.page,
      period,
      filter,
      selectedCategory,
      selectedWalletId,
      debouncedSearch,
    };
  });

  const fetchTransactionsRef = useRef(fetchTransactions);
  useEffect(() => {
    fetchTransactionsRef.current = fetchTransactions;
  }, [fetchTransactions]);

  // Fetch wallets directly from the authoritative endpoint
  const fetchWallets = useCallback(async () => {
    try {
      const res = await apiClient.get('/finance/wallets');
      const rawWallets = res.data?.data;
      if (Array.isArray(rawWallets)) {
        setWallets(
          rawWallets.map((w: any) => {
            const { type, icon } = resolveWalletTypeAndIcon(w.icon, w.name);
            return {
              id: w.id,
              name: w.name,
              balance: parseFloat(w.currentBalance) || 0,
              type,
              color: w.color || '#6366F1',
              icon,
              isDefault: Boolean(w.isDefault),
            };
          })
        );
      }
    } catch {
      // Degrade gracefully
    }
  }, []);

  const fetchWalletsRef = useRef(fetchWallets);
  useEffect(() => {
    fetchWalletsRef.current = fetchWallets;
  }, [fetchWallets]);

  useEffect(() => {
    fetchFinanceData(1);
    const handleRefresh = () => {
      const p = currentParamsRef.current;
      fetchTransactionsRef.current(p.page, p.period, p.filter, p.selectedCategory, p.selectedWalletId, p.debouncedSearch);
      fetchWalletsRef.current();
    };
    window.addEventListener('flux:refresh-data', handleRefresh);
    return () => window.removeEventListener('flux:refresh-data', handleRefresh);
  }, []); // Run ONLY once on mount! Never re-run when debouncedSearch or fetchTransactions changes!

  // Re-fetch transactions whenever period, filter, category, wallet, or debounced search query changes
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchTransactions(1, period, filter, selectedCategory, selectedWalletId, debouncedSearch);
  }, [fetchTransactions, period, filter, selectedCategory, selectedWalletId, debouncedSearch]);

  const handlePageChange = useCallback(async (newPage: number) => {
    fetchTransactions(newPage, period, filter, selectedCategory, selectedWalletId, debouncedSearch);
  }, [fetchTransactions, period, filter, selectedCategory, selectedWalletId, debouncedSearch]);

  const handleClearAllFilters = useCallback(() => {
    setFilter('ALL');
    setSelectedCategory('ALL');
    setSelectedWalletId('ALL');
    setSearchQuery('');
  }, []);

  const totalBalance = useMemo(() => wallets.reduce((acc, curr) => acc + curr.balance, 0), [wallets]);

  const handleTransfer = async (
    sourceWalletId: string,
    destWalletId: string,
    amt: number,
    note: string
  ) => {
    let createdTxId = `tx-${Date.now()}`;
    try {
      const res = await apiClient.post('/finance/transfer', {
        sourceWalletId,
        destinationWalletId: destWalletId,
        amount: amt,
        note,
      });
      if (res.data?.data?.id) {
        createdTxId = res.data.data.id;
      }
    } catch {
      // Degrade gracefully if backend/session is offline
    }

    setWallets((prev) =>
      prev.map((w) => {
        if (w.id === sourceWalletId) return { ...w, balance: w.balance - amt };
        if (w.id === destWalletId) return { ...w, balance: w.balance + amt };
        return w;
      })
    );

    const src = wallets.find((w) => w.id === sourceWalletId);
    const dest = wallets.find((w) => w.id === destWalletId);

    const newTx: TransactionItem = {
      id: createdTxId,
      type: 'TRANSFER',
      wallet: src?.name || 'Ví',
      walletId: sourceWalletId,
      destWallet: dest?.name,
      destWalletId: destWalletId,
      category: 'Chuyển tiền nội bộ',
      amount: amt,
      date: new Date().toLocaleDateString('vi-VN'),
      rawDate: new Date().toISOString().slice(0, 10),
      note,
    };

    setTransactions((prev) => [newTx, ...prev]);
    fetchWallets();
    toast.success('Chuyển tiền thành công! Số dư các ví đã được cập nhật.');
    window.dispatchEvent(new CustomEvent('flux:refresh-data'));
  };

  const handleWalletCreated = (newWallet: WalletItem) => {
    setWallets((prev) => {
      if (newWallet.isDefault) {
        return [newWallet, ...prev.map((w) => ({ ...w, isDefault: false }))];
      }
      return [...prev, newWallet];
    });
  };

  const handleOpenCategoryModal = useCallback(() => setIsCategoryModalOpen(true), []);
  const handleOpenTransferModal = useCallback(() => setIsTransferModalOpen(true), []);
  const handleOpenAddWalletModal = useCallback(() => setIsAddWalletModalOpen(true), []);
  const handleOpenAddTx = useCallback(() => setIsAddTxModalOpen(true), []);

  const handleSetDefaultWallet = useCallback(async (walletId: string) => {
    let walletName = '';
    // Optimistic UI update: target becomes default and is placed at the front
    setWallets((prev) => {
      const target = prev.find((w) => w.id === walletId);
      if (!target) return prev;
      walletName = target.name;
      const updated = prev.map((w) => ({
        ...w,
        isDefault: w.id === walletId,
      }));
      return [...updated].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    });

    try {
      await apiClient.patch(`/finance/wallets/${walletId}/default`);
      toast.success(walletName ? `Đã đặt "${walletName}" làm ví mặc định!` : 'Đã đặt ví mặc định!');
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đặt ví mặc định.'));
      fetchFinanceData(1);
    }
  }, []);

  const handleTransactionCreated = (
    newTx: TransactionItem,
    walletId: string,
    deltaBalance: number
  ) => {
    setWallets((prev) =>
      prev.map((w) => (w.id === walletId ? { ...w, balance: w.balance + deltaBalance } : w))
    );
    setTransactions((prev) => [newTx, ...prev]);
    // Refresh calculations and totals for the current period
    fetchTransactions(1, period, filter, selectedCategory, selectedWalletId, debouncedSearch);
    fetchWallets();
    window.dispatchEvent(new CustomEvent('flux:refresh-data'));
  };

  const handleTransactionUpdated = useCallback(() => {
    setIsEditTxModalOpen(false);
    setEditingTx(null);
    fetchWallets();
    const p = currentParamsRef.current;
    fetchTransactions(p.page, p.period, p.filter, p.selectedCategory, p.selectedWalletId, p.debouncedSearch);
  }, [fetchWallets, fetchTransactions]);

  const handleOpenEditTx = useCallback((tx: TransactionItem) => {
    setEditingTx(tx);
    setIsEditTxModalOpen(true);
  }, []);

  const handleCategoryCreated = (cat: CategoryItem) => {
    setCategories((prev) => [...prev, cat]);
  };

  const handleCategoryUpdated = (updatedCat: CategoryItem, oldName: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    );
    if (oldName && oldName !== updatedCat.name) {
      setTransactions((prev) =>
        prev.map((tx) => (tx.category === oldName ? { ...tx, category: updatedCat.name } : tx))
      );
      if (selectedCategory === oldName) setSelectedCategory(updatedCat.name);
    }
  };

  const handleRequestDeleteCategory = useCallback((cat: CategoryItem) => {
    setDeleteModalState({
      isOpen: true,
      type: 'CATEGORY',
      targetCategory: cat,
      isLoading: false,
    });
  }, []);

  const handleRequestDeleteTx = useCallback((tx: TransactionItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteModalState({
      isOpen: true,
      type: 'TRANSACTION',
      targetTx: tx,
      isLoading: false,
    });
  }, []);

  const handleOpenEditWallet = useCallback((wallet: WalletItem) => {
    setEditingWallet(wallet);
    setIsEditWalletModalOpen(true);
  }, []);

  const handleWalletUpdated = (updatedWallet: WalletItem) => {
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id === updatedWallet.id) return updatedWallet;
        if (updatedWallet.isDefault) return { ...w, isDefault: false };
        return w;
      })
    );
  };

  const handleRequestDeleteWallet = useCallback((wallet: WalletItem) => {
    setWallets((prev) => {
      if (prev.length <= 1) {
        toast.error('Bạn không thể xóa ví duy nhất còn lại. Hệ thống yêu cầu ít nhất 1 ví.');
        return prev;
      }
      setDeleteModalState({
        isOpen: true,
        type: 'WALLET',
        targetWallet: wallet,
        isLoading: false,
      });
      return prev;
    });
  }, []);

  const handleConfirmDelete = async () => {
    if (deleteModalState.type === 'TRANSACTION' && deleteModalState.targetTx) {
      const tx = deleteModalState.targetTx;
      setDeleteModalState((prev) => ({ ...prev, isLoading: true }));
      try {
        await apiClient.delete(`/finance/transactions/${tx.id}`);
        toast.success('Đã xóa giao dịch và hoàn lại số dư ví thành công!');
        setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
        setDeleteModalState({ isOpen: false, type: null, isLoading: false });
        fetchWallets();
        const p = currentParamsRef.current;
        fetchTransactions(p.page, p.period, p.filter, p.selectedCategory, p.selectedWalletId, p.debouncedSearch);
        window.dispatchEvent(new CustomEvent('flux:refresh-data'));
      } catch (err) {
        toast.error(getErrorMessage(err, 'Không thể xóa giao dịch.'));
        setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
      }
    } else if (deleteModalState.type === 'CATEGORY' && deleteModalState.targetCategory) {
      const cat = deleteModalState.targetCategory;
      setDeleteModalState((prev) => ({ ...prev, isLoading: true }));

      try {
        await apiClient.delete(`/finance/categories/${cat.id}`);
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        if (selectedCategory === cat.name) setSelectedCategory('ALL');
        toast.success(`Đã xóa danh mục "${cat.name}".`);
        setDeleteModalState({ isOpen: false, type: null, isLoading: false });
        window.dispatchEvent(new CustomEvent('flux:refresh-data'));
      } catch (err) {
        toast.error(getErrorMessage(err, 'Không thể xóa danh mục.'));
        setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
      }
    } else if (deleteModalState.type === 'WALLET' && deleteModalState.targetWallet) {
      const wallet = deleteModalState.targetWallet;
      setDeleteModalState((prev) => ({ ...prev, isLoading: true }));

      try {
        await apiClient.delete(`/finance/wallets/${wallet.id}`);
        setWallets((prev) => prev.filter((w) => w.id !== wallet.id));
        toast.success(`Đã xóa ví "${wallet.name}" thành công.`);
        setDeleteModalState({ isOpen: false, type: null, isLoading: false });
        window.dispatchEvent(new CustomEvent('flux:refresh-data'));
      } catch (err) {
        toast.error(getErrorMessage(err, 'Không thể xóa ví.'));
        setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
      }
    }
  };

  const handleExportCSV = useCallback(async () => {
    try {
      toast.info('Đang chuẩn bị file CSV dữ liệu...');
      const params: Record<string, any> = {
        page: 1,
        limit: 1000,
      };
      if (period.mode === 'MONTH') {
        params.month = period.month;
        params.year = period.year;
      } else if (period.mode === 'RANGE') {
        if (period.startDate) params.startDate = period.startDate;
        if (period.endDate) params.endDate = period.endDate;
      } else if (period.mode === 'ALL') {
        params.allTime = 'true';
      }
      if (filter !== 'ALL') params.type = filter;
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedWalletId !== 'ALL') params.walletId = selectedWalletId;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = await apiClient.get('/finance/transactions', { params });
      const rawData = res.data?.data;
      const items = rawData?.items || transactions;

      if (!items || items.length === 0) {
        toast.error('Không có giao dịch nào phù hợp để xuất.');
        return;
      }

      const headers = ['Mã Giao Dịch', 'Loại', 'Ví Nguồn', 'Ví Đích', 'Danh Mục', 'Số Tiền (VND)', 'Ngày', 'Ghi Chú'];
      const rows = items.map((tx: any) => [
        tx.id,
        tx.type,
        `"${tx.wallet?.name || tx.wallet || ''}"`,
        `"${tx.destinationWallet?.name || tx.destWallet || ''}"`,
        `"${tx.category || ''}"`,
        tx.amount,
        `"${tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString('vi-VN') : tx.date || ''}"`,
        `"${(tx.note || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileSuffix = period.mode === 'MONTH' ? `thang${period.month}_${period.year}` : new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `flux_giaodich_${fileSuffix}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Đã xuất ${items.length} giao dịch ra file CSV thành công!`);
    } catch {
      toast.error('Không thể xuất file CSV.');
    }
  }, [period, filter, selectedCategory, selectedWalletId, debouncedSearch, transactions]);

  return (
    <div className="space-y-6">
        {/* Header & Balance Banner */}
        <FinanceHeader
          totalBalance={totalBalance}
          netCashflow={summary.netCashflow}
          monthlyIncome={summary.monthlyIncome}
          monthlyExpense={summary.monthlyExpense}
          periodLabel={periodLabel}
          isLoading={isInitialLoading}
          onOpenCategoryModal={handleOpenCategoryModal}
          onOpenTransferModal={handleOpenTransferModal}
          onOpenAddWalletModal={handleOpenAddWalletModal}
        />

        {/* Wallets Grid */}
        <WalletList
          wallets={wallets}
          isLoading={isInitialLoading}
          onOpenAddWallet={handleOpenAddWalletModal}
          onSetDefaultWallet={handleSetDefaultWallet}
          onEditWallet={handleOpenEditWallet}
          onDeleteWallet={handleRequestDeleteWallet}
        />

        {/* Transactions Section */}
        <TransactionList
          transactions={transactions}
          filteredTransactions={transactions}
          categories={categories}
          wallets={wallets}
          filter={filter}
          onFilterChange={setFilter}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedWalletId={selectedWalletId}
          onSelectWallet={setSelectedWalletId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          period={period}
          onPeriodChange={setPeriod}
          periodSummary={periodSummary}
          filteredStats={filteredStats}
          periodLabel={periodLabel}
          onClearAllFilters={handleClearAllFilters}
          onOpenAddTx={handleOpenAddTx}
          onOpenCategoryModal={handleOpenCategoryModal}
          onExportCSV={handleExportCSV}
          onOpenEditTx={handleOpenEditTx}
          onRequestDeleteTx={handleRequestDeleteTx}
          isLoading={isTxLoading}
          pagination={txPagination}
          onPageChange={handlePageChange}
        />

        {/* Transfer Modal */}
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          wallets={wallets}
          onTransfer={handleTransfer}
        />

        {/* Add Wallet Modal */}
        <AddWalletModal
          isOpen={isAddWalletModalOpen}
          onClose={() => setIsAddWalletModalOpen(false)}
          onWalletCreated={handleWalletCreated}
        />

        {/* Edit Wallet Modal */}
        <EditWalletModal
          isOpen={isEditWalletModalOpen}
          wallet={editingWallet}
          onClose={() => {
            setIsEditWalletModalOpen(false);
            setEditingWallet(null);
          }}
          onWalletUpdated={handleWalletUpdated}
        />

        {/* Add Transaction Modal */}
        <AddTransactionModal
          isOpen={isAddTxModalOpen}
          onClose={() => setIsAddTxModalOpen(false)}
          wallets={wallets}
          categories={categories}
          initialCategory={selectedCategory !== 'ALL' ? selectedCategory : undefined}
          initialWalletId={selectedWalletId !== 'ALL' ? selectedWalletId : undefined}
          initialType={filter === 'INCOME' || filter === 'EXPENSE' ? filter : undefined}
          onTransactionCreated={handleTransactionCreated}
          onOpenCategoryModal={() => {
            setIsAddTxModalOpen(false);
            setIsCategoryModalOpen(true);
          }}
        />

        {/* Edit Transaction Modal */}
        <EditTransactionModal
          isOpen={isEditTxModalOpen}
          onClose={() => {
            setIsEditTxModalOpen(false);
            setEditingTx(null);
          }}
          transaction={editingTx}
          wallets={wallets}
          categories={categories}
          onSuccess={handleTransactionUpdated}
        />

        {/* Category Management Modal */}
        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          transactions={transactions}
          onCategoryCreated={handleCategoryCreated}
          onCategoryUpdated={handleCategoryUpdated}
          onRequestDeleteCategory={handleRequestDeleteCategory}
        />

        {/* Modern Delete Confirmation Dialog */}
        <ConfirmModal
          isOpen={deleteModalState.isOpen}
          isLoading={deleteModalState.isLoading}
          onClose={() => {
            if (!deleteModalState.isLoading) {
              setDeleteModalState({ isOpen: false, type: null, isLoading: false });
            }
          }}
          onConfirm={handleConfirmDelete}
          title={
            deleteModalState.type === 'TRANSACTION'
              ? 'Xác Nhận Xóa Giao Dịch?'
              : deleteModalState.type === 'WALLET'
              ? 'Xác Nhận Xóa Ví Tiền?'
              : 'Xác Nhận Xóa Danh Mục?'
          }
          description={
            deleteModalState.type === 'TRANSACTION'
              ? 'Hành động này sẽ xóa vĩnh viễn giao dịch khỏi hệ thống. Số dư các ví liên quan sẽ tự động được hoàn trả chính xác.'
              : deleteModalState.type === 'WALLET'
              ? 'Hành động này sẽ xóa vĩnh viễn ví tiền khỏi hệ thống. Lưu ý: Chỉ có thể xóa ví chưa phát sinh giao dịch nào.'
              : 'Danh mục này sẽ bị xóa khỏi danh sách. Các giao dịch trước đây vẫn được bảo toàn dữ liệu.'
          }
          confirmText="Xác Nhận Xóa"
          cancelText="Giữ Lại"
          variant="danger"
          highlightContent={
            deleteModalState.type === 'TRANSACTION' && deleteModalState.targetTx ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {deleteModalState.targetTx.category}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    <span>{deleteModalState.targetTx.date}</span>
                    <span className="mx-1">•</span>
                    <span>
                      {deleteModalState.targetTx.type === 'TRANSFER'
                        ? `${deleteModalState.targetTx.wallet} → ${deleteModalState.targetTx.destWallet}`
                        : deleteModalState.targetTx.wallet}
                    </span>
                  </div>
                  {deleteModalState.targetTx.note && (
                    <div className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">
                      "{deleteModalState.targetTx.note}"
                    </div>
                  )}
                </div>
                <div
                  className={`text-sm font-extrabold tabular-nums flex-shrink-0 ${
                    deleteModalState.targetTx.type === 'INCOME'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : deleteModalState.targetTx.type === 'EXPENSE'
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-brand'
                  }`}
                >
                  {deleteModalState.targetTx.type === 'INCOME'
                    ? `+${formatCurrency(deleteModalState.targetTx.amount)}`
                    : `-${formatCurrency(deleteModalState.targetTx.amount)}`}
                </div>
              </div>
            ) : deleteModalState.type === 'CATEGORY' && deleteModalState.targetCategory ? (
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: deleteModalState.targetCategory.color || '#6366F1' }}
                  />
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {deleteModalState.targetCategory.name}
                  </span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex-shrink-0 ${
                    deleteModalState.targetCategory.type === 'INCOME'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-rose-500/10 text-rose-500'
                  }`}
                >
                  {deleteModalState.targetCategory.type === 'INCOME' ? 'Khoản thu' : 'Khoản chi'}
                </span>
              </div>
            ) : deleteModalState.type === 'WALLET' && deleteModalState.targetWallet ? (() => {
              const { type: walletTypeLabel, icon: WalletIcon } = resolveWalletTypeAndIcon(
                deleteModalState.targetWallet.icon,
                deleteModalState.targetWallet.name
              );
              return (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${deleteModalState.targetWallet.color || '#3B82F6'}20`,
                        color: deleteModalState.targetWallet.color || '#3B82F6',
                      }}
                    >
                      <WalletIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {deleteModalState.targetWallet.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {walletTypeLabel} {deleteModalState.targetWallet.isDefault && '• Ví mặc định'}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tabular-nums flex-shrink-0">
                    {formatCurrency(deleteModalState.targetWallet.balance)}
                  </div>
                </div>
              );
            })() : null
          }
        />
      </div>
  );
};
