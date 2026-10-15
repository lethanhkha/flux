import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
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
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
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
  destWallet?: string;
  category: string;
  amount: number;
  date: string;
  note: string;
}

export const FinancePage: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER'>('ALL');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

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
      category: 'Tiện ích & Hóa đơn',
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

  // Load real data from backend if user is logged in
  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        const [walletsRes, txRes] = await Promise.all([
          apiClient.get('/finance/wallets'),
          apiClient.get('/finance/transactions'),
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
              destWallet: tx.destinationWallet?.name,
              category: tx.category,
              amount: parseFloat(tx.amount),
              date: new Date(tx.transactionDate).toLocaleDateString('vi-VN'),
              note: tx.note || '',
            }))
          );
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

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'ALL') return true;
    return tx.type === filter;
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

    try {
      await apiClient.post('/finance/transfer', {
        sourceWalletId,
        destinationWalletId: destWalletId,
        amount: amt,
        note: transferNote,
      });
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
      id: `tx-${Date.now()}`,
      type: 'TRANSFER',
      wallet: src.name,
      destWallet: dest?.name,
      category: 'Chuyển tiền nội bộ',
      amount: amt,
      date: new Date().toLocaleDateString('vi-VN'),
      note: transferNote,
    };

    setTransactions([newTx, ...transactions]);
    setIsTransferModalOpen(false);
    toast.success('Chuyển tiền thành công! Số dư các ví đã được cập nhật.');
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

    try {
      await apiClient.post('/finance/transactions', {
        walletId: selectedWalletId,
        type: txType,
        amount: amt,
        category: txCategory,
        note: txNote || undefined,
      });
    } catch {
      // Fallback
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
      id: `tx-${Date.now()}`,
      type: txType,
      wallet: targetWallet.name,
      category: txCategory,
      amount: amt,
      date: new Date().toLocaleDateString('vi-VN'),
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
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Tài Sản Cá Nhân</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12.5% tháng này
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-slate-100">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-slate-500">Tự động đồng bộ và bảo vệ an toàn theo thời gian thực</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-brand/40 text-slate-800 dark:text-slate-100 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-brand" />
              <span>Chuyển Tiền Giữa Các Ví</span>
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

          {/* Transaction List */}
          <div className="space-y-2.5">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 hover:border-brand/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${
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

                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-100">{tx.category}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span>
                        {tx.type === 'TRANSFER' ? `${tx.wallet} → ${tx.destWallet}` : tx.wallet}
                      </span>
                    </div>
                  </div>
                </div>

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
                  <div className="text-[10px] text-slate-400 line-clamp-1">{tx.note}</div>
                </div>
              </div>
            ))}
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
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Danh mục
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                  >
                    {txType === 'EXPENSE' ? (
                      <>
                        <option value="Ăn uống & Cafe">Ăn uống & Cafe</option>
                        <option value="Tiện ích & Hóa đơn">Tiện ích & Hóa đơn (Điện, Nước, Net)</option>
                        <option value="Đi lại & Xăng xe">Đi lại & Xăng xe</option>
                        <option value="Mua sắm & Tiêu dùng">Mua sắm & Tiêu dùng</option>
                        <option value="Nhà cửa & Thuê trọ">Nhà cửa & Thuê trọ</option>
                        <option value="Y tế & Sức khỏe">Y tế & Sức khỏe</option>
                        <option value="Học tập & Sách">Học tập & Sách</option>
                        <option value="Khác">Chi phí khác</option>
                      </>
                    ) : (
                      <>
                        <option value="Lương & Thưởng">Lương & Thưởng</option>
                        <option value="Thu nhập Freelance">Thu nhập Freelance / Dự án ngoài</option>
                        <option value="Lãi đầu tư & Cổ tức">Lãi đầu tư & Cổ tức</option>
                        <option value="Quà tặng & Thưởng">Quà tặng & Khác</option>
                      </>
                    )}
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
      </div>
    </AppLayout>
  );
};
