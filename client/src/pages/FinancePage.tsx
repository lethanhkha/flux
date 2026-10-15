import React, { useState, useEffect } from 'react';
import { apiClient, getErrorMessage } from '../api/client';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Plus,
  TrendingUp,
  Building,
  PiggyBank,
  X,
  Download,
  FolderTree,
  Edit3,
  Trash2,
  Check,
  Sparkles,
  Tag,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

interface WalletItem {
  id: string;
  name: string;
  balance: number;
  type: string;
  color: string;
  icon: any;
}

interface TransactionItem {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  wallet: string;
  walletId?: string;
  destWallet?: string;
  destWalletId?: string;
  category: string;
  amount: number;
  date: string;
  rawDate?: string;
  note: string;
}

interface CategoryItem {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  icon?: string;
  color?: string;
}

export const FinancePage: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

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

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryType, setEditCategoryType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [editCategoryColor, setEditCategoryColor] = useState('#6366F1');
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [newCatColor, setNewCatColor] = useState('#6366F1');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  const [wallets, setWallets] = useState<WalletItem[]>([
    { id: 'w1', name: 'Ví Tiền Mặt', balance: 3500000, type: 'Tiền mặt', color: '#6366F1', icon: Wallet },
    { id: 'w2', name: 'Techcombank', balance: 30000000, type: 'Tài khoản ngân hàng', color: '#10B981', icon: Building },
    { id: 'w3', name: 'Quỹ Tiết Kiệm Khẩn Cấp', balance: 15000000, type: 'Tiết kiệm có kỳ hạn', color: '#F59E0B', icon: PiggyBank },
  ]);

  const [transactions, setTransactions] = useState<TransactionItem[]>([
    {
      id: 'tx1',
      type: 'INCOME',
      wallet: 'Techcombank',
      category: 'Lương & Thưởng',
      amount: 25000000,
      date: '15/10/2026',
      note: 'Nhận lương tháng 10 từ công ty',
    },
    {
      id: 'tx2',
      type: 'EXPENSE',
      wallet: 'Ví Tiền Mặt',
      category: 'Ăn uống & Cafe',
      amount: 180000,
      date: '15/10/2026',
      note: 'Ăn trưa & Cafe sáng',
    },
    {
      id: 'tx3',
      type: 'TRANSFER',
      wallet: 'Techcombank',
      destWallet: 'Quỹ Tiết Kiệm Khẩn Cấp',
      category: 'Chuyển tiền tiết kiệm',
      amount: 5000000,
      date: '14/10/2026',
      note: 'Trích quỹ tích lũy định kỳ 20%',
    },
    {
      id: 'tx4',
      type: 'EXPENSE',
      wallet: 'Techcombank',
      category: 'Tiền nhà & Hóa đơn',
      amount: 1250000,
      date: '12/10/2026',
      note: 'Thanh toán tiền điện và cước Internet FPT',
    },
  ]);

  const [sourceWalletId, setSourceWalletId] = useState('w2');
  const [destWalletId, setDestWalletId] = useState('w1');
  const [transferAmount, setTransferAmount] = useState('1000000');
  const [transferNote, setTransferNote] = useState('Rút tiền mặt tiêu dùng');

  // Add Wallet Modal State
  const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState('Ví điện tử');
  const [newWalletBalance, setNewWalletBalance] = useState('0');
  const [newWalletColor, setNewWalletColor] = useState('#6366F1');

  // Add Transaction Modal State
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [txWalletId, setTxWalletId] = useState('');
  const [txAmount, setTxAmount] = useState('100000');
  const [txCategory, setTxCategory] = useState('Ăn uống & Cafe');
  const [txNote, setTxNote] = useState('');

  // Edit Transaction Modal State
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxType, setEditTxType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
  const [editTxWalletId, setEditTxWalletId] = useState('');
  const [editTxDestWalletId, setEditTxDestWalletId] = useState('');
  const [editTxAmount, setEditTxAmount] = useState('100000');
  const [editTxCategory, setEditTxCategory] = useState('Ăn uống & Cafe');
  const [editTxDate, setEditTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [editTxNote, setEditTxNote] = useState('');
  const [isSubmittingEditTx, setIsSubmittingEditTx] = useState(false);

  // Modern Delete Confirmation State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: 'TRANSACTION' | 'CATEGORY' | null;
    targetTx?: TransactionItem;
    targetCategory?: CategoryItem;
    isLoading: boolean;
  }>({
    isOpen: false,
    type: null,
    isLoading: false,
  });

  // Load real data from backend if user is logged in
  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        const [walletsRes, txRes, catRes] = await Promise.all([
          apiClient.get('/finance/wallets'),
          apiClient.get('/finance/transactions'),
          apiClient.get('/finance/categories'),
        ]);

        if (walletsRes.data.data?.length > 0) {
          setWallets(
            walletsRes.data.data.map((w: any) => ({
              id: w.id,
              name: w.name,
              balance: parseFloat(w.currentBalance),
              type: w.currency === 'VND' ? 'Tiền mặt / Số dư' : w.currency,
              color: w.color || '#6366F1',
              icon: Wallet,
            }))
          );
          setSourceWalletId(walletsRes.data.data[0].id);
          if (walletsRes.data.data.length > 1) {
            setDestWalletId(walletsRes.data.data[1].id);
          }
        }

        if (txRes.data.data?.items?.length > 0) {
          setTransactions(
            txRes.data.data.items.map((tx: any) => ({
              id: tx.id,
              type: tx.type,
              wallet: tx.wallet?.name || 'Ví',
              walletId: tx.walletId,
              destWallet: tx.destinationWallet?.name,
              destWalletId: tx.destinationWalletId,
              category: tx.category,
              amount: parseFloat(tx.amount),
              date: new Date(tx.transactionDate).toLocaleDateString('vi-VN'),
              rawDate: tx.transactionDate ? new Date(tx.transactionDate).toISOString().slice(0, 10) : undefined,
              note: tx.note || '',
            }))
          );
        }

        if (Array.isArray(catRes.data.data) && catRes.data.data.length > 0) {
          setCategories(catRes.data.data);
        }
      } catch {
        // Fallback to initial mock prototype state seamlessly
      }
    };

    fetchFinanceData();
    const handleRefresh = () => {
      fetchFinanceData();
    };
    window.addEventListener('flux:refresh-data', handleRefresh);
    return () => window.removeEventListener('flux:refresh-data', handleRefresh);
  }, []);

  const totalBalance = wallets.reduce((acc, curr) => acc + curr.balance, 0);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error('Vui lòng nhập tên danh mục.');
      return;
    }
    setIsSubmittingCat(true);
    const tempId = `cat-${Date.now()}`;
    const newCategory: CategoryItem = {
      id: tempId,
      name: newCatName.trim(),
      type: newCatType,
      color: newCatColor,
    };
    setCategories((prev) => [...prev, newCategory]);
    setNewCatName('');
    toast.success(`Đã thêm danh mục "${newCategory.name}" thành công!`);

    try {
      const res = await apiClient.post('/finance/categories', {
        name: newCategory.name,
        type: newCategory.type,
        color: newCategory.color,
      });
      if (res.data.data?.id) {
        setCategories((prev) =>
          prev.map((c) => (c.id === tempId ? { ...c, id: res.data.data.id } : c))
        );
      }
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch {
      // Degrade gracefully
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleStartEditCategory = (cat: CategoryItem) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
    setEditCategoryType(cat.type as 'INCOME' | 'EXPENSE');
    setEditCategoryColor(cat.color || '#6366F1');
  };

  const handleSaveEditCategory = async (catId: string) => {
    if (!editCategoryName.trim()) {
      toast.error('Tên danh mục không được để trống.');
      return;
    }
    const oldCat = categories.find((c) => c.id === catId);
    const oldName = oldCat?.name || '';
    const newName = editCategoryName.trim();

    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, name: newName, type: editCategoryType, color: editCategoryColor }
          : c
      )
    );
    if (oldName && oldName !== newName) {
      setTransactions((prev) =>
        prev.map((tx) => (tx.category === oldName ? { ...tx, category: newName } : tx))
      );
      if (selectedCategory === oldName) setSelectedCategory(newName);
    }
    setEditingCategoryId(null);
    toast.success(`Đã cập nhật danh mục "${newName}"!`);

    try {
      await apiClient.patch(`/finance/categories/${catId}`, {
        name: newName,
        type: editCategoryType,
        color: editCategoryColor,
      });
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch {
      // Degrade gracefully
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

  const filteredTransactions = transactions.filter((tx) => {
    if (filter !== 'ALL' && tx.type !== filter) return false;
    if (selectedCategory !== 'ALL' && tx.category !== selectedCategory) return false;
    return true;
  });

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);

    if (sourceWalletId === destWalletId) {
      toast.error('Ví nguồn và ví đích không được trùng nhau.');
      return;
    }

    const src = wallets.find((w) => w.id === sourceWalletId);
    if (!src || src.balance < amt) {
      toast.error('Số dư ví nguồn không đủ để thực hiện chuyển tiền.');
      return;
    }

    let createdTxId = `tx-${Date.now()}`;
    try {
      const res = await apiClient.post('/finance/transfer', {
        sourceWalletId,
        destinationWalletId: destWalletId,
        amount: amt,
        note: transferNote,
      });
      if (res.data?.data?.id) {
        createdTxId = res.data.data.id;
      }
    } catch {
      // Degrade gracefully if backend/session is offline
    }

    // Apply DB Lock state update
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id === sourceWalletId) return { ...w, balance: w.balance - amt };
        if (w.id === destWalletId) return { ...w, balance: w.balance + amt };
        return w;
      })
    );

    const dest = wallets.find((w) => w.id === destWalletId);

    const newTx: TransactionItem = {
      id: createdTxId,
      type: 'TRANSFER',
      wallet: src.name,
      walletId: sourceWalletId,
      destWallet: dest?.name,
      destWalletId: destWalletId,
      category: 'Chuyển tiền nội bộ',
      amount: amt,
      date: new Date().toLocaleDateString('vi-VN'),
      rawDate: new Date().toISOString().slice(0, 10),
      note: transferNote,
    };

    setTransactions([newTx, ...transactions]);
    setIsTransferModalOpen(false);
    toast.success('Chuyển tiền thành công! Số dư các ví đã được cập nhật.');
    window.dispatchEvent(new CustomEvent('flux:refresh-data'));
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) {
      toast.error('Vui lòng nhập tên ví.');
      return;
    }

    const initBal = parseFloat(newWalletBalance) || 0;
    if (initBal < 0) {
      toast.error('Số dư ban đầu không được âm.');
      return;
    }

    try {
      const res = await apiClient.post('/finance/wallets', {
        name: newWalletName.trim(),
        currency: 'VND',
        initialBalance: initBal,
        color: newWalletColor,
        icon: 'wallet',
      });

      const created = res.data.data;
      const newWallet: WalletItem = {
        id: created.id,
        name: created.name,
        balance: parseFloat(created.currentBalance),
        type: newWalletType,
        color: created.color || newWalletColor,
        icon: Wallet,
      };

      setWallets((prev) => [...prev, newWallet]);
      setIsAddWalletModalOpen(false);
      setNewWalletName('');
      setNewWalletBalance('0');
      toast.success(`Đã tạo ví "${created.name}" thành công!`);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch {
      // Fallback
      const fallbackWallet: WalletItem = {
        id: `w-${Date.now()}`,
        name: newWalletName.trim(),
        balance: initBal,
        type: newWalletType,
        color: newWalletColor,
        icon: Wallet,
      };
      setWallets((prev) => [...prev, fallbackWallet]);
      setIsAddWalletModalOpen(false);
      setNewWalletName('');
      setNewWalletBalance('0');
      toast.success(`Đã tạo ví "${fallbackWallet.name}" thành công!`);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ (> 0).');
      return;
    }

    const selectedWalletId = txWalletId || wallets[0]?.id;
    const targetWallet = wallets.find((w) => w.id === selectedWalletId);
    if (!targetWallet) {
      toast.error('Vui lòng chọn ví thực hiện giao dịch.');
      return;
    }

    if (txType === 'EXPENSE' && targetWallet.balance < amt) {
      toast.error(`Số dư ví "${targetWallet.name}" không đủ để chi tiêu.`);
      return;
    }

    let createdId = `tx-${Date.now()}`;
    try {
      const res = await apiClient.post('/finance/transactions', {
        walletId: selectedWalletId,
        type: txType,
        amount: amt,
        category: txCategory,
        note: txNote || undefined,
      });
      if (res.data?.data?.id) {
        createdId = res.data.data.id;
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ghi nhận giao dịch.'));
      return;
    }

    // Update wallet balance
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id === selectedWalletId) {
          const newBal = txType === 'INCOME' ? w.balance + amt : w.balance - amt;
          return { ...w, balance: newBal };
        }
        return w;
      })
    );

    const newTx: TransactionItem = {
      id: createdId,
      type: txType,
      wallet: targetWallet.name,
      walletId: selectedWalletId,
      category: txCategory,
      amount: amt,
      date: new Date().toLocaleDateString('vi-VN'),
      rawDate: new Date().toISOString().slice(0, 10),
      note: txNote,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setIsAddTxModalOpen(false);
    setTxAmount('100000');
    setTxNote('');
    toast.success(
      txType === 'INCOME'
        ? `Đã ghi nhận khoản thu: +${formatCurrency(amt)}`
        : `Đã ghi nhận khoản chi: -${formatCurrency(amt)}`
    );
    window.dispatchEvent(new CustomEvent('flux:refresh-data'));
  };

  const handleOpenEditTx = (tx: TransactionItem) => {
    setEditingTxId(tx.id);
    setEditTxType(tx.type);

    const matchedWallet = wallets.find((w) => w.id === tx.walletId || w.name === tx.wallet);
    setEditTxWalletId(matchedWallet?.id || wallets[0]?.id || '');

    if (tx.destWalletId || tx.destWallet) {
      const matchedDestWallet = wallets.find((w) => w.id === tx.destWalletId || w.name === tx.destWallet);
      setEditTxDestWalletId(matchedDestWallet?.id || wallets[1]?.id || wallets[0]?.id || '');
    } else {
      setEditTxDestWalletId(wallets[1]?.id || wallets[0]?.id || '');
    }

    setEditTxAmount(tx.amount.toString());
    setEditTxCategory(tx.category);
    setEditTxDate(tx.rawDate || new Date().toISOString().slice(0, 10));
    setEditTxNote(tx.note || '');
    setIsEditTxModalOpen(true);
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTxId) return;

    const amt = parseFloat(editTxAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ (> 0).');
      return;
    }

    const srcWallet = wallets.find((w) => w.id === editTxWalletId);
    if (!srcWallet) {
      toast.error('Vui lòng chọn ví thực hiện.');
      return;
    }

    if (editTxType === 'TRANSFER' && editTxWalletId === editTxDestWalletId) {
      toast.error('Ví nguồn và ví đích không được trùng nhau.');
      return;
    }

    setIsSubmittingEditTx(true);
    try {
      const payload: any = {
        type: editTxType,
        walletId: editTxWalletId,
        amount: amt,
        category: editTxType === 'TRANSFER' ? 'Chuyển tiền nội bộ' : (editTxCategory || 'Khác'),
        note: editTxNote || undefined,
        transactionDate: editTxDate ? new Date(editTxDate).toISOString() : undefined,
      };
      if (editTxType === 'TRANSFER') {
        payload.destinationWalletId = editTxDestWalletId;
      }

      await apiClient.patch(`/finance/transactions/${editingTxId}`, payload);

      toast.success('Đã cập nhật giao dịch thành công!');
      setIsEditTxModalOpen(false);
      setEditingTxId(null);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật giao dịch.'));
    } finally {
      setIsSubmittingEditTx(false);
    }
  };

  const handleRequestDeleteTransaction = (tx: TransactionItem, e?: React.MouseEvent) => {
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
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      if (selectedCategory === cat.name) setSelectedCategory('ALL');
      toast.success(`Đã xóa danh mục "${cat.name}".`);

      try {
        await apiClient.delete(`/finance/categories/${cat.id}`);
        setDeleteModalState({ isOpen: false, type: null, isLoading: false });
        window.dispatchEvent(new CustomEvent('flux:refresh-data'));
      } catch {
        // Degrade gracefully
        setDeleteModalState({ isOpen: false, type: null, isLoading: false });
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tự Do Tài Chính & Kiến Tạo Tương Lai</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Dòng Tiền & Tự Do Tài Chính
            </h1>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-brand dark:text-brand-light">
                {formatCurrency(totalBalance)}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12.5% tháng này
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Làm chủ thu chi đa ví, thiết lập quỹ dự phòng và kiểm soát danh mục tài sản theo thời gian thực
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="Quản lý các danh mục thu chi"
            >
              <FolderTree className="w-4 h-4 text-brand" />
              <span>Quản Lý Danh Mục</span>
            </button>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-brand/40 text-slate-800 dark:text-slate-100 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-brand" />
              <span>Chuyển Tiền</span>
            </button>
            <button
              onClick={() => setIsAddWalletModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Ví Mới</span>
            </button>
          </div>
        </div>

        {/* Wallets Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-700 dark:text-slate-300">Danh Sách Ví Tiền ({wallets.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {wallets.map((w) => {
              const Icon = w.icon;
              return (
                <div
                  key={w.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover-lift space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: w.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs line-clamp-1">{w.name}</div>
                        <div className="text-[10px] text-slate-500">{w.type}</div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatCurrency(w.balance)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-base">Lịch Sử Giao Dịch</h2>
              <p className="text-xs text-slate-500">Mọi khoản thu, chi và chuyển khoản có định dạng tabular-nums</p>
            </div>

            {/* Action buttons & Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  if (wallets.length > 0 && !txWalletId) {
                    setTxWalletId(wallets[0].id);
                  }
                  setIsAddTxModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Giao Dịch</span>
              </button>

              <button
                onClick={handleExportCSV}
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
                    onClick={() => setFilter(type)}
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
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 pl-1 flex-shrink-0">
              <Tag className="w-3.5 h-3.5 text-brand" /> Danh mục:
            </span>
            <button
              onClick={() => setSelectedCategory('ALL')}
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
                  onClick={() => setSelectedCategory(isActive ? 'ALL' : cat.name)}
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
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                Không tìm thấy giao dịch nào phù hợp với bộ lọc danh mục hoặc loại giao dịch.
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
                        setSelectedCategory(
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
                  <div className="flex items-center gap-1 opacity-80 sm:opacity-40 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenEditTx(tx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                      title="Chỉnh sửa giao dịch"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRequestDeleteTransaction(tx, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Xóa giao dịch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* Transfer Modal */}
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm modal-backdrop-animate">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl modal-dialog-animate space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base">Chuyển Tiền Giữa Các Ví</h3>
                </div>
                <button
                  onClick={() => setIsTransferModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Ví nguồn (Trừ tiền)</label>
                  <select
                    value={sourceWalletId}
                    onChange={(e) => setSourceWalletId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatCurrency(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Ví đích (Cộng tiền)</label>
                  <select
                    value={destWalletId}
                    onChange={(e) => setDestWalletId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatCurrency(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Số tiền chuyển (VND)</label>
                  <input
                    type="number"
                    required
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base font-extrabold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Ghi chú chuyển khoản</label>
                  <input
                    type="text"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all cursor-pointer"
                >
                  Xác Nhận Chuyển Tiền
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add Wallet Modal */}
        {isAddWalletModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm modal-backdrop-animate">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl modal-dialog-animate space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base">Thêm Ví Tiền Mới</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddWalletModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateWallet} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Tên ví / Tài khoản
                  </label>
                  <input
                    type="text"
                    required
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    placeholder="VD: Ví MoMo, BIDV SmartBanking, Quỹ Khẩn Cấp..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                      Loại ví
                    </label>
                    <select
                      value={newWalletType}
                      onChange={(e) => setNewWalletType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                    >
                      <option value="Ví điện tử">Ví điện tử</option>
                      <option value="Tài khoản ngân hàng">Tài khoản ngân hàng</option>
                      <option value="Tiền mặt">Tiền mặt</option>
                      <option value="Tiết kiệm có kỳ hạn">Sổ tiết kiệm</option>
                      <option value="Quỹ đầu tư">Quỹ đầu tư</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                      Số dư ban đầu (VND)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newWalletBalance}
                      onChange={(e) => setNewWalletBalance(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Màu sắc nhận diện
                  </label>
                  <div className="flex items-center gap-2.5">
                    {['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#3B82F6'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewWalletColor(c)}
                        style={{ backgroundColor: c }}
                        className={`h-7 w-7 rounded-full cursor-pointer transition-transform ${
                          newWalletColor === c ? 'scale-125 ring-2 ring-offset-2 ring-brand' : 'hover:scale-110'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all cursor-pointer"
                >
                  Tạo Ví Mới
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add Transaction Modal */}
        {isAddTxModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm modal-backdrop-animate">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl modal-dialog-animate space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base">Ghi Nhận Giao Dịch</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddTxModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs">
                {/* Transaction Type Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType('EXPENSE')}
                    className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      txType === 'EXPENSE'
                        ? 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Khoản Chi Tiền (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('INCOME')}
                    className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      txType === 'INCOME'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Khoản Thu Tiền (+)
                  </button>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Chọn Ví
                  </label>
                  <select
                    value={txWalletId || (wallets[0]?.id || '')}
                    onChange={(e) => setTxWalletId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatCurrency(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Số tiền (VND)
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base font-extrabold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 text-slate-700 dark:text-slate-300">
                    <label className="font-semibold">Danh mục</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-brand hover:underline text-[11px] font-medium cursor-pointer"
                    >
                      + Quản lý danh mục
                    </button>
                  </div>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                  >
                    {categories
                      .filter((c) => c.type === txType || c.type === 'EXPENSE')
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Ghi chú
                  </label>
                  <input
                    type="text"
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    placeholder="VD: Ăn tối với bạn, thanh toán hóa đơn..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all cursor-pointer"
                >
                  Lưu Giao Dịch
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {isEditTxModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm modal-backdrop-animate">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl modal-dialog-animate space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Chỉnh Sửa Giao Dịch</h3>
                    <p className="text-[11px] text-slate-400">
                      Số dư các ví liên quan sẽ được tự động tính toán lại
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditTxModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateTransaction} className="space-y-4 text-xs">
                {/* Transaction Type Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTxType('EXPENSE')}
                    className={`py-2 rounded-xl font-bold transition-all cursor-pointer text-center text-xs ${
                      editTxType === 'EXPENSE'
                        ? 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Chi tiền (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTxType('INCOME')}
                    className={`py-2 rounded-xl font-bold transition-all cursor-pointer text-center text-xs ${
                      editTxType === 'INCOME'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Thu tiền (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTxType('TRANSFER')}
                    className={`py-2 rounded-xl font-bold transition-all cursor-pointer text-center text-xs ${
                      editTxType === 'TRANSFER'
                        ? 'bg-brand/10 border border-brand/30 text-brand'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Chuyển khoản
                  </button>
                </div>

                {/* Wallets selection */}
                {editTxType === 'TRANSFER' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                        Ví nguồn (Trừ tiền)
                      </label>
                      <select
                        value={editTxWalletId}
                        onChange={(e) => setEditTxWalletId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                      >
                        {wallets.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                        Ví đích (Cộng tiền)
                      </label>
                      <select
                        value={editTxDestWalletId}
                        onChange={(e) => setEditTxDestWalletId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                      >
                        {wallets.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                      Chọn Ví
                    </label>
                    <select
                      value={editTxWalletId}
                      onChange={(e) => setEditTxWalletId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({formatCurrency(w.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Amount & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                      Số tiền (VND)
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      value={editTxAmount}
                      onChange={(e) => setEditTxAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base font-extrabold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                      Ngày giao dịch
                    </label>
                    <input
                      type="date"
                      required
                      value={editTxDate}
                      onChange={(e) => setEditTxDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>

                {/* Category if not transfer */}
                {editTxType !== 'TRANSFER' && (
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                      Danh mục
                    </label>
                    <select
                      value={editTxCategory}
                      onChange={(e) => setEditTxCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                    >
                      {categories
                        .filter((c) => c.type === editTxType || c.type === 'EXPENSE')
                        .map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Ghi chú
                  </label>
                  <input
                    type="text"
                    value={editTxNote}
                    onChange={(e) => setEditTxNote(e.target.value)}
                    placeholder="VD: Ăn tối với bạn, thanh toán hóa đơn..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditTxModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEditTx}
                    className="flex-1 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingEditTx ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Category Management Modal */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm modal-backdrop-animate">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl modal-dialog-animate space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Quản Lý Danh Mục Thu Chi</h3>
                    <p className="text-[11px] text-slate-400">
                      Tùy chỉnh các danh mục tài chính để phân loại giao dịch chính xác
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategoryId(null);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Add New Category */}
              <form
                onSubmit={handleCreateCategory}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-3 text-xs"
              >
                <div className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-brand" />
                  <span>Thêm danh mục mới</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold block mb-1">Tên danh mục</label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="VD: Giáo dục, Thú cưng..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Loại danh mục</label>
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                    >
                      <option value="EXPENSE">Khoản chi (-)</option>
                      <option value="INCOME">Khoản thu (+)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">Màu:</span>
                    {['#F97316', '#EC4899', '#3B82F6', '#EF4444', '#8B5CF6', '#10B981', '#06B6D4', '#6366F1'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCatColor(c)}
                        className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                          newCatColor === c ? 'scale-125 ring-2 ring-brand ring-offset-1' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingCat || !newCatName.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
                  >
                    + Thêm
                  </button>
                </div>
              </form>

              {/* Existing Categories List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Danh sách hiện có ({categories.length})</span>
                  <span className="text-[11px] font-normal text-slate-400">Nhấp để chỉnh sửa hoặc xóa</span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {categories.map((cat) => {
                    const isEditing = editingCategoryId === cat.id;
                    const txCount = transactions.filter((tx) => tx.category === cat.name).length;

                    return (
                      <div
                        key={cat.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        {isEditing ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              className="px-3 py-1.5 rounded-xl border border-brand bg-white dark:bg-slate-900 text-xs flex-1"
                              placeholder="Tên danh mục..."
                              autoFocus
                            />
                            <select
                              value={editCategoryType}
                              onChange={(e) => setEditCategoryType(e.target.value as any)}
                              className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                            >
                              <option value="EXPENSE">Chi (-)</option>
                              <option value="INCOME">Thu (+)</option>
                            </select>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSaveEditCategory(cat.id)}
                                className="p-1.5 rounded-lg bg-brand text-white hover:bg-brand-hover cursor-pointer"
                                title="Lưu thay đổi"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategoryId(null)}
                                className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 cursor-pointer"
                                title="Hủy"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: cat.color || '#6366F1' }}
                              />
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {cat.name}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold flex-shrink-0 ${
                                  cat.type === 'INCOME'
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-rose-500/10 text-rose-500'
                                }`}
                              >
                                {cat.type === 'INCOME' ? 'Khoản thu' : 'Khoản chi'}
                              </span>
                              {txCount > 0 && (
                                <span className="text-[10px] text-slate-400 flex-shrink-0">
                                  ({txCount} GD)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditCategory(cat)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                                title="Đổi tên danh mục"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestDeleteCategory(cat)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Xóa danh mục"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategoryId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Hoàn Tất
                </button>
              </div>
            </div>
          </div>
        )}

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
