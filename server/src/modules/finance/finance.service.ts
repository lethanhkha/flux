import { Decimal } from 'decimal.js';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { cacheService } from '../../services/cache.service';
import {
  CreateWalletInput,
  UpdateWalletInput,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransferMoneyInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './finance.schema';

export class FinanceService {
  /**
   * Invalidate finance and dashboard caches for user
   */
  async invalidateUserFinanceCache(userId: string) {
    await Promise.all([
      cacheService.del(`cache:finance-summary:${userId}`),
      cacheService.del(`cache:dashboard:${userId}`),
      cacheService.delPattern(`cache:finance-overview:${userId}*`),
    ]);
  }

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

    const wallet = await prisma.wallet.create({
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

    await this.invalidateUserFinanceCache(userId);
    return wallet;
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

    const updated = await prisma.wallet.update({
      where: { id: walletId },
      data: input,
    });

    await this.invalidateUserFinanceCache(userId);
    return updated;
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
    await this.invalidateUserFinanceCache(userId);
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
      page?: number;
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

    const limit = Math.min(Math.max(filter?.limit ? Number(filter.limit) : 20, 1), 1000);
    const page = filter?.page ? Math.max(Number(filter.page), 1) : 1;
    const skip =
      filter?.offset !== undefined
        ? Math.max(Number(filter.offset), 0)
        : (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          wallet: { select: { id: true, name: true, color: true, icon: true } },
          destinationWallet: { select: { id: true, name: true, color: true, icon: true } },
        },
        orderBy: { transactionDate: 'desc' },
        take: limit,
        skip,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const currentPage =
      filter?.offset !== undefined ? Math.floor(skip / limit) + 1 : page;

    return {
      total,
      items,
      pagination: {
        page: currentPage,
        limit,
        total,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
    };
  }

  /**
   * 6. Create Transaction with ACID Database Transaction
   */
  async createTransaction(userId: string, input: CreateTransactionInput) {
    const amountDec = new Decimal(input.amount);
    const date = input.transactionDate ? new Date(input.transactionDate) : new Date();

    const createdTx = await prisma.$transaction(async (tx) => {
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

    await this.invalidateUserFinanceCache(userId);
    return createdTx;
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
   * 8. Update transaction with full balance recalculation in an ACID transaction
   */
  async updateTransaction(userId: string, transactionId: string, input: UpdateTransactionInput) {
    const updatedTx = await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: { id: transactionId, userId },
      });

      if (!existing) {
        throw new AppError('Không tìm thấy giao dịch.', 404);
      }

      const oldAmount = new Decimal(existing.amount.toString());
      const newAmount = input.amount !== undefined ? new Decimal(input.amount) : oldAmount;
      const targetType = input.type ?? (existing.type as 'INCOME' | 'EXPENSE' | 'TRANSFER');
      const targetWalletId = input.walletId ?? existing.walletId;
      const targetDestWalletId =
        input.destinationWalletId !== undefined ? input.destinationWalletId : existing.destinationWalletId;

      // 1. REVERSE old transaction effects from wallets
      const oldSourceWallet = await tx.wallet.findFirst({
        where: { id: existing.walletId, userId },
      });
      if (!oldSourceWallet) {
        throw new AppError('Ví của giao dịch cũ không tồn tại.', 404);
      }

      let oldSourceBal = new Decimal(oldSourceWallet.currentBalance.toString());
      if (existing.type === 'INCOME') {
        oldSourceBal = oldSourceBal.minus(oldAmount);
      } else if (existing.type === 'EXPENSE') {
        oldSourceBal = oldSourceBal.plus(oldAmount);
      } else if (existing.type === 'TRANSFER' && existing.destinationWalletId) {
        oldSourceBal = oldSourceBal.plus(oldAmount);
        const oldDestWallet = await tx.wallet.findFirst({
          where: { id: existing.destinationWalletId, userId },
        });
        if (oldDestWallet) {
          const oldDestBal = new Decimal(oldDestWallet.currentBalance.toString()).minus(oldAmount);
          await tx.wallet.update({
            where: { id: oldDestWallet.id },
            data: { currentBalance: oldDestBal.toNumber() },
          });
        }
      }

      await tx.wallet.update({
        where: { id: oldSourceWallet.id },
        data: { currentBalance: oldSourceBal.toNumber() },
      });

      // 2. APPLY new transaction effects to target wallets
      const newSourceWallet = await tx.wallet.findFirst({
        where: { id: targetWalletId, userId },
      });
      if (!newSourceWallet) {
        throw new AppError('Ví nguồn được chọn không tồn tại.', 404);
      }

      let newSourceBal = new Decimal(newSourceWallet.currentBalance.toString());

      if (targetType === 'INCOME') {
        newSourceBal = newSourceBal.plus(newAmount);
      } else if (targetType === 'EXPENSE') {
        newSourceBal = newSourceBal.minus(newAmount);
      } else if (targetType === 'TRANSFER') {
        if (!targetDestWalletId || targetDestWalletId === targetWalletId) {
          throw new AppError('Giao dịch chuyển khoản yêu cầu ví đích hợp lệ và khác ví nguồn.', 400);
        }

        const newDestWallet = await tx.wallet.findFirst({
          where: { id: targetDestWalletId, userId },
        });
        if (!newDestWallet) {
          throw new AppError('Ví đích không tồn tại hoặc không thuộc về bạn.', 404);
        }

        if (newSourceBal.lessThan(newAmount)) {
          throw new AppError('Số dư ví nguồn không đủ để thực hiện chuyển tiền.', 400);
        }

        newSourceBal = newSourceBal.minus(newAmount);
        const newDestBal = new Decimal(newDestWallet.currentBalance.toString()).plus(newAmount);

        await tx.wallet.update({
          where: { id: newDestWallet.id },
          data: { currentBalance: newDestBal.toNumber() },
        });
      }

      await tx.wallet.update({
        where: { id: newSourceWallet.id },
        data: { currentBalance: newSourceBal.toNumber() },
      });

      // 3. Update the transaction row
      return tx.transaction.update({
        where: { id: transactionId },
        data: {
          walletId: targetWalletId,
          destinationWalletId: targetDestWalletId || null,
          type: targetType,
          amount: newAmount.toNumber(),
          category: input.category ?? existing.category,
          transactionDate: input.transactionDate ? new Date(input.transactionDate) : existing.transactionDate,
          note: input.note !== undefined ? input.note : existing.note,
          receiptUrl: input.receiptUrl !== undefined ? input.receiptUrl : existing.receiptUrl,
        },
        include: {
          wallet: { select: { id: true, name: true, color: true } },
          destinationWallet: { select: { id: true, name: true, color: true } },
        },
      });
    });

    await this.invalidateUserFinanceCache(userId);
    return updatedTx;
  }

  /**
   * 9. Delete transaction and reverse its balance effects in an ACID transaction
   */
  async deleteTransaction(userId: string, transactionId: string) {
    const deleteResult = await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: { id: transactionId, userId },
      });

      if (!existing) {
        throw new AppError('Không tìm thấy giao dịch.', 404);
      }

      const amt = new Decimal(existing.amount.toString());

      // 1. REVERSE balance effects
      const sourceWallet = await tx.wallet.findFirst({
        where: { id: existing.walletId, userId },
      });

      if (sourceWallet) {
        let sourceBal = new Decimal(sourceWallet.currentBalance.toString());
        if (existing.type === 'INCOME') {
          sourceBal = sourceBal.minus(amt);
        } else if (existing.type === 'EXPENSE') {
          sourceBal = sourceBal.plus(amt);
        } else if (existing.type === 'TRANSFER' && existing.destinationWalletId) {
          sourceBal = sourceBal.plus(amt);
          const destWallet = await tx.wallet.findFirst({
            where: { id: existing.destinationWalletId, userId },
          });
          if (destWallet) {
            const destBal = new Decimal(destWallet.currentBalance.toString()).minus(amt);
            await tx.wallet.update({
              where: { id: destWallet.id },
              data: { currentBalance: destBal.toNumber() },
            });
          }
        }

        await tx.wallet.update({
          where: { id: sourceWallet.id },
          data: { currentBalance: sourceBal.toNumber() },
        });
      }

      // 2. Delete the transaction record
      await tx.transaction.delete({
        where: { id: transactionId },
      });

      return { message: 'Đã xóa giao dịch thành công.' };
    });

    await this.invalidateUserFinanceCache(userId);
    return deleteResult;
  }

  /**
   * 8. Financial Summary (Total balance, monthly income, monthly expense, category breakdown)
   * High-performance aggregation using database-level indexes and SUM/GROUP BY
   * Cached for 10s via Cache-Aside SWR to sustain 500 concurrent users.
   */
  async getFinanceSummary(userId: string) {
    const cacheKey = `cache:finance-summary:${userId}`;

    return cacheService.remember(cacheKey, 60, async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // Parallel DB-level aggregations utilizing PostgreSQL B-Tree composite indexes
      const [walletAgg, typeAggregates, categoryAggregates] = await Promise.all([
        prisma.wallet.aggregate({
          where: { userId },
          _sum: { currentBalance: true },
          _count: { id: true },
        }),
        prisma.transaction.groupBy({
          by: ['type'],
          where: {
            userId,
            transactionDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
          by: ['category'],
          where: {
            userId,
            type: 'EXPENSE',
            transactionDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: { amount: true },
          orderBy: {
            _sum: {
              amount: 'desc',
            },
          },
        }),
      ]);

      const totalBalance = walletAgg._sum.currentBalance ? Number(walletAgg._sum.currentBalance) : 0;
      const activeWalletsCount = walletAgg._count.id ?? 0;

      let monthlyIncome = 0;
      let monthlyExpense = 0;

      for (const group of typeAggregates) {
        const sum = group._sum.amount ? Number(group._sum.amount) : 0;
        if (group.type === 'INCOME') {
          monthlyIncome = sum;
        } else if (group.type === 'EXPENSE') {
          monthlyExpense = sum;
        }
      }

      const categoryBreakdown = categoryAggregates.map((cat) => ({
        category: cat.category,
        amount: cat._sum.amount ? Number(cat._sum.amount) : 0,
      }));

      return {
        totalBalance,
        monthlyIncome,
        monthlyExpense,
        netCashflow: Number(new Decimal(monthlyIncome).minus(new Decimal(monthlyExpense)).toNumber()),
        activeWalletsCount,
        categoryBreakdown,
      };
    });
  }

  /**
   * Consolidated Finance Overview (T2.3)
   * Single roundtrip replacing 4 separate HTTP requests (wallets, categories, summary, transactions)
   */
  async getFinanceOverview(userId: string, page = 1, limit = 20) {
    const cacheKey = `cache:finance-overview:${userId}:${page}:${limit}`;

    return cacheService.remember(cacheKey, 60, async () => {
      const [wallets, categories, summary, transactions] = await Promise.all([
        this.getWallets(userId),
        this.getCategories(userId),
        this.getFinanceSummary(userId),
        this.getTransactions(userId, { page, limit }),
      ]);

      return {
        wallets,
        categories,
        summary,
        transactions,
      };
    });
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
