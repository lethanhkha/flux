import React, { useState, useEffect } from 'react';
import { apiClient, getErrorMessage } from '../api/client';
import { AppLayout } from '../components/layout/AppLayout';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

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
  AddTransactionModal,
  EditTransactionModal,
  CategoryModal,
  resolveWalletTypeAndIcon,
} from '../components/finance';
import { PaginationMeta } from '../components/common/PaginationControl';

export const FinancePage: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals visibility state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState(false);
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState({
    monthlyIncome: 0,
    monthlyExpense: 0,
    netCashflow: 0,
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

  // Consolidated Load: Single roundtrip (T2.3) replacing 4 separate calls
  const fetchFinanceData = async (page = 1) => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/finance/overview', {
        params: { page, limit: 20 },
      });

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
      }

      if (Array.isArray(rawCategories)) {
        setCategories(rawCategories);
      }

      if (rawSummary) {
        setSummary({
          monthlyIncome: Number(rawSummary.monthlyIncome) || 0,
          monthlyExpense: Number(rawSummary.monthlyExpense) || 0,
          netCashflow: Number(rawSummary.netCashflow) || 0,
        });
      }
    } catch {
      // Degrade gracefully if backend/network error occurs
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData(1);
    const handleRefresh = () => {
      fetchFinanceData(txPagination.page);
    };
    window.addEventListener('flux:refresh-data', handleRefresh);
    return () => window.removeEventListener('flux:refresh-data', handleRefresh);
  }, []);

  const handlePageChange = async (newPage: number) => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/finance/transactions', {
        params: { page: newPage, limit: 20 },
      });
      const rawTx = res.data?.data;
      const items = rawTx?.items || (Array.isArray(rawTx) ? rawTx : []);
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
      if (rawTx?.pagination) {
        setTxPagination(rawTx.pagination);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const totalBalance = wallets.reduce((acc, curr) => acc + curr.balance, 0);

  const filteredTransactions = transactions.filter((tx) => {
    if (filter !== 'ALL' && tx.type !== filter) return false;
    if (selectedCategory !== 'ALL' && tx.category !== selectedCategory) return false;
    return true;
  });

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

  const handleSetDefaultWallet = async (walletId: string) => {
    const target = wallets.find((w) => w.id === walletId);
    if (!target) return;

    // Optimistic UI update: target becomes default and is placed at the front
    setWallets((prev) => {
      const updated = prev.map((w) => ({
        ...w,
        isDefault: w.id === walletId,
      }));
      return [...updated].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    });

    try {
      await apiClient.patch(`/finance/wallets/${walletId}/default`);
      toast.success(`Đã đặt "${target.name}" làm ví mặc định!`);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đặt ví mặc định.'));
      fetchFinanceData(txPagination.page);
    }
  };

  const handleTransactionCreated = (
    newTx: TransactionItem,
    walletId: string,
    deltaBalance: number
  ) => {
    setWallets((prev) =>
      prev.map((w) => (w.id === walletId ? { ...w, balance: w.balance + deltaBalance } : w))
    );
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleOpenEditTx = (tx: TransactionItem) => {
    setEditingTx(tx);
    setIsEditTxModalOpen(true);
  };

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

  const handleRequestDeleteCategory = (cat: CategoryItem) => {
    setDeleteModalState({
      isOpen: true,
      type: 'CATEGORY',
      targetCategory: cat,
      isLoading: false,
    });
  };

  const handleRequestDeleteTx = (tx: TransactionItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteModalState({
      isOpen: true,
      type: 'TRANSACTION',
      targetTx: tx,
      isLoading: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteModalState.type === 'TRANSACTION' && deleteModalState.targetTx) {
      const tx = deleteModalState.targetTx;
      setDeleteModalState((prev) => ({ ...prev, isLoading: true }));
      try {
        await apiClient.delete(`/finance/transactions/${tx.id}`);
        toast.success('Đã xóa giao dịch và hoàn lại số dư ví thành công!');
        setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
        setDeleteModalState({ isOpen: false, type: null, isLoading: false });
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
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error('Không có giao dịch nào để xuất.');
      return;
    }
    const headers = ['Mã Giao Dịch', 'Loại', 'Ví Nguồn', 'Ví Đích', 'Danh Mục', 'Số Tiền (VND)', 'Ngày', 'Ghi Chú'];
    const rows = transactions.map((tx) => [
      tx.id,
      tx.type,
      `"${tx.wallet || ''}"`,
      `"${tx.destWallet || ''}"`,
      `"${tx.category || ''}"`,
      tx.amount,
      `"${tx.date || ''}"`,
      `"${(tx.note || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `flux_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất báo cáo giao dịch ra file CSV thành công!');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header & Balance Banner */}
        <FinanceHeader
          totalBalance={totalBalance}
          netCashflow={summary.netCashflow}
          monthlyIncome={summary.monthlyIncome}
          monthlyExpense={summary.monthlyExpense}
          isLoading={isLoading}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          onOpenTransferModal={() => setIsTransferModalOpen(true)}
          onOpenAddWalletModal={() => setIsAddWalletModalOpen(true)}
        />

        {/* Wallets Grid */}
        <WalletList
          wallets={wallets}
          isLoading={isLoading}
          onOpenAddWallet={() => setIsAddWalletModalOpen(true)}
          onSetDefaultWallet={handleSetDefaultWallet}
        />

        {/* Transactions Section */}
        <TransactionList
          transactions={transactions}
          filteredTransactions={filteredTransactions}
          categories={categories}
          filter={filter}
          onFilterChange={setFilter}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onOpenAddTx={() => setIsAddTxModalOpen(true)}
          onExportCSV={handleExportCSV}
          onOpenEditTx={handleOpenEditTx}
          onRequestDeleteTx={handleRequestDeleteTx}
          isLoading={isLoading}
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

        {/* Add Transaction Modal */}
        <AddTransactionModal
          isOpen={isAddTxModalOpen}
          onClose={() => setIsAddTxModalOpen(false)}
          wallets={wallets}
          categories={categories}
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
          onSuccess={() => {
            setIsEditTxModalOpen(false);
            setEditingTx(null);
          }}
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
              : 'Xác Nhận Xóa Danh Mục?'
          }
          description={
            deleteModalState.type === 'TRANSACTION'
              ? 'Hành động này sẽ xóa vĩnh viễn giao dịch khỏi hệ thống. Số dư các ví liên quan sẽ tự động được hoàn trả chính xác.'
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
            ) : null
          }
        />
      </div>
    </AppLayout>
  );
};
