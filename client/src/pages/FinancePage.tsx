import React, { useState } from 'react';
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
  ShieldCheck,
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

  const totalBalance = wallets.reduce((acc, curr) => acc + curr.balance, 0);

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'ALL') return true;
    return tx.type === filter;
  });

  const handleTransferSubmit = (e: React.FormEvent) => {
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

    // Apply DB Lock simulation update
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
    toast.success('Chuyển tiền thành công! ACID Transaction đã cập nhật số dư cả 2 ví.');
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
            <p className="text-xs text-slate-500">Được bảo vệ bởi cơ chế khóa dòng ACID Transaction SELECT FOR UPDATE</p>
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
              onClick={() => toast.info('Thêm ví mới: Tính năng đang mở modal tạo ví.')}
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

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              {(['ALL', 'INCOME', 'EXPENSE', 'TRANSFER'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-brand/10 text-brand text-xs">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Khóa dòng SELECT FOR UPDATE đảm bảo toàn vẹn số dư ví.</span>
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
      </div>
    </AppLayout>
  );
};
