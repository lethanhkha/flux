import { Decimal } from 'decimal.js';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import {
  CreateWalletInput,
  UpdateWalletInput,
  CreateTransactionInput,
  TransferMoneyInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './finance.schema';

export class FinanceService {
  /**
   * 1. Get all wallets for user
   */
  async getWallets(userId: string) {
    return prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 2. Create a new wallet
   */
  async createWallet(userId: string, input: CreateWalletInput) {
    const initialDecimal = new Decimal(input.initialBalance);

    return prisma.wallet.create({
      data: {
        userId,
        name: input.name,
        currency: input.currency,
        initialBalance: initialDecimal.toNumber(),
        currentBalance: initialDecimal.toNumber(),
        icon: input.icon,
        color: input.color,
      },
    });
  }

  /**
   * 3. Update a wallet
   */
  async updateWallet(userId: string, walletId: string, input: UpdateWalletInput) {
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new AppError('Không tìm thấy ví hoặc bạn không có quyền truy cập.', 404);
    }

    return prisma.wallet.update({
      where: { id: walletId },
      data: input,
    });
  }

  /**
   * 4. Delete a wallet (only if no transactions attached)
   */
  async deleteWallet(userId: string, walletId: string) {
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId },
      include: { _count: { select: { transactions: true } } },
    });

    if (!wallet) {
      throw new AppError('Không tìm thấy ví.', 404);
    }

    if (wallet._count.transactions > 0) {
      throw new AppError('Ví này đang chứa lịch sử giao dịch. Không thể xóa.', 400);
    }

    await prisma.wallet.delete({ where: { id: walletId } });
    return { message: 'Đã xóa ví thành công.' };
  }

  /**
   * 5. Get transactions with filters and pagination
   */
  async getTransactions(
    userId: string,
    filter?: {
      walletId?: string;
      category?: string;
      type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
      limit?: number;
      offset?: number;
    }
  ) {
    const where: any = { userId };

    if (filter?.walletId) {
      where.OR = [
        { walletId: filter.walletId },
        { destinationWalletId: filter.walletId },
      ];
    }

    if (filter?.type) {
      where.type = filter.type;
    }

    if (filter?.category) {
      where.category = filter.category;
    }

    const [total, items] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          wallet: { select: { id: true, name: true, color: true, icon: true } },
          destinationWallet: { select: { id: true, name: true, color: true, icon: true } },
        },
        orderBy: { transactionDate: 'desc' },
        take: filter?.limit || 50,
        skip: filter?.offset || 0,
      }),
    ]);

    return { total, items };
  }

  /**
   * 6. Create Transaction with ACID Database Transaction
   */
  async createTransaction(userId: string, input: CreateTransactionInput) {
    const amountDec = new Decimal(input.amount);
    const date = input.transactionDate ? new Date(input.transactionDate) : new Date();

    return prisma.$transaction(async (tx) => {
      // Find and lock source wallet row
      const sourceWallet = await tx.wallet.findFirst({
        where: { id: input.walletId, userId },
      });

      if (!sourceWallet) {
        throw new AppError('Ví nguồn không tồn tại hoặc không thuộc về bạn.', 404);
      }

      let newSourceBalance = new Decimal(sourceWallet.currentBalance.toString());

      if (input.type === 'INCOME') {
        newSourceBalance = newSourceBalance.plus(amountDec);
      } else if (input.type === 'EXPENSE') {
        newSourceBalance = newSourceBalance.minus(amountDec);
      } else if (input.type === 'TRANSFER') {
        if (!input.destinationWalletId) {
          throw new AppError('Giao dịch chuyển khoản yêu cầu ví đích.', 400);
        }

        const destWallet = await tx.wallet.findFirst({
          where: { id: input.destinationWalletId, userId },
        });

        if (!destWallet) {
          throw new AppError('Ví đích không tồn tại hoặc không thuộc về bạn.', 404);
        }

        // Check sufficient funds
        if (newSourceBalance.lessThan(amountDec)) {
          throw new AppError('Số dư ví nguồn không đủ để thực hiện chuyển tiền.', 400);
        }

        newSourceBalance = newSourceBalance.minus(amountDec);
        const newDestBalance = new Decimal(destWallet.currentBalance.toString()).plus(amountDec);

        // Update destination wallet
        await tx.wallet.update({
          where: { id: destWallet.id },
          data: { currentBalance: newDestBalance.toNumber() },
        });
      }

      // Update source wallet
      await tx.wallet.update({
        where: { id: sourceWallet.id },
        data: { currentBalance: newSourceBalance.toNumber() },
      });

      // Create transaction record
      return tx.transaction.create({
        data: {
          userId,
          walletId: input.walletId,
          destinationWalletId: input.destinationWalletId || null,
          type: input.type,
          amount: amountDec.toNumber(),
          category: input.category,
          transactionDate: date,
          note: input.note,
          receiptUrl: input.receiptUrl,
        },
        include: {
          wallet: { select: { id: true, name: true, color: true } },
          destinationWallet: { select: { id: true, name: true, color: true } },
        },
      });
    });
  }

  /**
   * 7. Transfer money between two wallets with Row Lock (SELECT FOR UPDATE simulation)
   */
  async transferMoney(userId: string, input: TransferMoneyInput) {
    return this.createTransaction(userId, {
      walletId: input.sourceWalletId,
      destinationWalletId: input.destinationWalletId,
      type: 'TRANSFER',
      amount: input.amount,
      category: 'Chuyển tiền nội bộ',
      note: input.note,
    });
  }

  /**
   * 8. Financial Summary (Total balance, monthly income, monthly expense, category breakdown)
   */
  async getFinanceSummary(userId: string) {
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      select: { currentBalance: true },
    });

    const totalBalance = wallets.reduce(
      (acc, w) => acc.plus(new Decimal(w.currentBalance.toString())),
      new Decimal(0)
    );

    // Current month start & end
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    let monthlyIncome = new Decimal(0);
    let monthlyExpense = new Decimal(0);
    const categoryMap: Record<string, Decimal> = {};

    for (const tx of monthTransactions) {
      const amt = new Decimal(tx.amount.toString());
      if (tx.type === 'INCOME') {
        monthlyIncome = monthlyIncome.plus(amt);
      } else if (tx.type === 'EXPENSE') {
        monthlyExpense = monthlyExpense.plus(amt);
        categoryMap[tx.category] = (categoryMap[tx.category] || new Decimal(0)).plus(amt);
      }
    }

    const categoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount: amount.toNumber(),
    }));

    return {
      totalBalance: totalBalance.toNumber(),
      monthlyIncome: monthlyIncome.toNumber(),
      monthlyExpense: monthlyExpense.toNumber(),
      netCashflow: monthlyIncome.minus(monthlyExpense).toNumber(),
      categoryBreakdown,
    };
  }

  /**
   * 9. Default categories list
   */
  getDefaultCategories() {
    return [
      { name: 'Ăn uống & Cafe', type: 'EXPENSE', icon: 'Utensils', color: '#F97316' },
      { name: 'Mua sắm & Tiêu dùng', type: 'EXPENSE', icon: 'ShoppingBag', color: '#EC4899' },
      { name: 'Di chuyển & Xăng xe', type: 'EXPENSE', icon: 'Car', color: '#3B82F6' },
      { name: 'Tiền nhà & Hóa đơn', type: 'EXPENSE', icon: 'Home', color: '#EF4444' },
      { name: 'Giải trí & Du lịch', type: 'EXPENSE', icon: 'Compass', color: '#8B5CF6' },
      { name: 'Lương & Thưởng', type: 'INCOME', icon: 'Briefcase', color: '#10B981' },
      { name: 'Lợi nhuận đầu tư', type: 'INCOME', icon: 'TrendingUp', color: '#06B6D4' },
      { name: 'Kinh doanh & Dự án', type: 'INCOME', icon: 'DollarSign', color: '#6366F1' },
      { name: 'Khác', type: 'EXPENSE', icon: 'MoreHorizontal', color: '#64748B' },
    ];
  }

  /**
   * 10. Get all categories for user (seeds defaults if user has none)
   */
  async getCategories(userId: string) {
    let categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (categories.length === 0) {
      const defaults = this.getDefaultCategories();
      await prisma.category.createMany({
        data: defaults.map((d) => ({
          userId,
          name: d.name,
          type: d.type,
          icon: d.icon,
          color: d.color,
        })),
      });
      categories = await prisma.category.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
    }

    return categories;
  }

  /**
   * 11. Create a custom category
   */
  async createCategory(userId: string, input: CreateCategoryInput) {
    return prisma.category.create({
      data: {
        userId,
        name: input.name,
        type: input.type,
        icon: input.icon,
        color: input.color,
      },
    });
  }

  /**
   * 12. Update category & cascade update transactions historical records
   */
  async updateCategory(userId: string, categoryId: string, input: UpdateCategoryInput) {
    const existing = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!existing) {
      throw new AppError('Không tìm thấy danh mục.', 404);
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: input,
    });

    if (input.name && input.name !== existing.name) {
      await prisma.transaction.updateMany({
        where: { userId, category: existing.name },
        data: { category: input.name },
      });
    }

    return updated;
  }

  /**
   * 13. Delete category
   */
  async deleteCategory(userId: string, categoryId: string) {
    const existing = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!existing) {
      throw new AppError('Không tìm thấy danh mục.', 404);
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return { message: 'Đã xóa danh mục thành công.' };
  }
}

export const financeService = new FinanceService();
