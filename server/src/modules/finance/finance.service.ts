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
   * 1. Get all wallets for user (ordered by isDefault desc, then createdAt asc)
   */
  async getWallets(userId: string) {
    return prisma.wallet.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * 2. Create a new wallet
   */
  async createWallet(userId: string, input: CreateWalletInput) {
    const initialDecimal = new Decimal(input.initialBalance);

    const wallet = await prisma.$transaction(async (tx) => {
      const existingWalletsCount = await tx.wallet.count({ where: { userId } });
      const shouldBeDefault = input.isDefault || existingWalletsCount === 0;

      if (shouldBeDefault) {
        await tx.wallet.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.wallet.create({
        data: {
          userId,
          name: input.name,
          currency: input.currency,
          initialBalance: initialDecimal.toNumber(),
          currentBalance: initialDecimal.toNumber(),
          icon: input.icon,
          color: input.color,
          isDefault: shouldBeDefault,
        },
      });
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

    const updated = await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.wallet.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      } else if (input.isDefault === false && wallet.isDefault) {
        const anotherWallet = await tx.wallet.findFirst({
          where: { userId, id: { not: walletId } },
          orderBy: { createdAt: 'asc' },
        });
        if (anotherWallet) {
          await tx.wallet.update({
            where: { id: anotherWallet.id },
            data: { isDefault: true },
          });
        } else {
          input.isDefault = true;
        }
      }

      return tx.wallet.update({
        where: { id: walletId },
        data: input,
      });
    });

    await this.invalidateUserFinanceCache(userId);
    return updated;
  }

  /**
   * 3b. Set a wallet as default
   */
  async setDefaultWallet(userId: string, walletId: string) {
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new AppError('Không tìm thấy ví hoặc bạn không có quyền truy cập.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.wallet.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      return tx.wallet.update({
        where: { id: walletId },
        data: { isDefault: true },
      });
    });

    await this.invalidateUserFinanceCache(userId);
    return updated;
  }

  /**
   * 4. Delete a wallet (only if no transactions attached and not the only wallet)
   */
  async deleteWallet(userId: string, walletId: string) {
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId },
      include: {
        _count: {
          select: {
            transactions: true,
            transfersIn: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new AppError('Không tìm thấy ví.', 404);
    }

    const totalWallets = await prisma.wallet.count({ where: { userId } });
    if (totalWallets <= 1) {
      throw new AppError('Bạn không thể xóa ví duy nhất còn lại. Hệ thống yêu cầu ít nhất 1 ví hoạt động.', 400);
    }

    const totalTxs = (wallet._count.transactions || 0) + (wallet._count.transfersIn || 0);
    if (totalTxs > 0) {
      throw new AppError(`Ví này đang chứa ${totalTxs} giao dịch. Không thể xóa ví đang có lịch sử giao dịch.`, 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.wallet.delete({ where: { id: walletId } });

      if (wallet.isDefault) {
        const nextWallet = await tx.wallet.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' },
        });
        if (nextWallet) {
          await tx.wallet.update({
            where: { id: nextWallet.id },
            data: { isDefault: true },
          });
        }
      }
    });

    await this.invalidateUserFinanceCache(userId);
    return { message: 'Đã xóa ví thành công.' };
  }

  /**
   * Helper: Parse date range filter into Date objects for Prisma query
   */
  private parseDateRange(filter?: {
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    allTime?: boolean;
  }): { gte?: Date; lte?: Date } | undefined {
    if (filter?.allTime || filter?.startDate === 'ALL') {
      return undefined;
    }

    if (filter?.month && filter?.year) {
      const start = new Date(filter.year, filter.month - 1, 1, 0, 0, 0, 0);
      const end = new Date(filter.year, filter.month, 0, 23, 59, 59, 999);
      return { gte: start, lte: end };
    }

    if (filter?.startDate || filter?.endDate) {
      const range: { gte?: Date; lte?: Date } = {};
      if (filter.startDate) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(filter.startDate)) {
          const [y, m, d] = filter.startDate.split('-').map(Number);
          range.gte = new Date(y, m - 1, d, 0, 0, 0, 0);
        } else {
          range.gte = new Date(filter.startDate);
        }
      }
      if (filter.endDate) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(filter.endDate)) {
          const [y, m, d] = filter.endDate.split('-').map(Number);
          range.lte = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else {
          range.lte = new Date(filter.endDate);
        }
      }
      return range;
    }

    // Default: Current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { gte: startOfMonth, lte: endOfMonth };
  }

  /**
   * 5. Get transactions with filters, pagination, and real-time aggregated insights
   */
  async getTransactions(
    userId: string,
    filter?: {
      walletId?: string;
      category?: string;
      type?: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ALL';
      limit?: number;
      offset?: number;
      page?: number;
      startDate?: string;
      endDate?: string;
      month?: number;
      year?: number;
      allTime?: boolean;
      search?: string;
    }
  ) {
    const where: any = { userId };
    const dateRange = this.parseDateRange(filter);

    if (dateRange) {
      where.transactionDate = dateRange;
    }

    if (filter?.walletId) {
      where.OR = [
        { walletId: filter.walletId },
        { destinationWalletId: filter.walletId },
      ];
    }

    if (filter?.type && filter.type !== 'ALL') {
      where.type = filter.type;
    }

    if (filter?.category && filter.category !== 'ALL') {
      where.category = filter.category;
    }

    if (filter?.search?.trim()) {
      const q = filter.search.trim();
      const searchCondition = [
        { note: { contains: q, mode: 'insensitive' as const } },
        { category: { contains: q, mode: 'insensitive' as const } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchCondition }];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
    }

    const limit = Math.min(Math.max(filter?.limit ? Number(filter.limit) : 20, 1), 1000);
    const page = filter?.page ? Math.max(Number(filter.page), 1) : 1;
    const skip =
      filter?.offset !== undefined
        ? Math.max(Number(filter.offset), 0)
        : (page - 1) * limit;

    // Period summary condition (independent of category/wallet/type/search)
    const periodWhere: any = { userId };
    if (dateRange) {
      periodWhere.transactionDate = dateRange;
    }

    const [total, items, filterAgg, periodTypes, maxTx] = await Promise.all([
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
      // Filtered set statistics
      prisma.transaction.aggregate({
        where,
        _sum: { amount: true },
        _avg: { amount: true },
        _max: { amount: true },
        _count: { id: true },
      }),
      // Period totals (all transactions in the active time window)
      prisma.transaction.groupBy({
        by: ['type'],
        where: periodWhere,
        _sum: { amount: true },
      }),
      // Largest transaction in the filtered set for instant insight
      prisma.transaction.findFirst({
        where,
        orderBy: { amount: 'desc' },
        select: { id: true, amount: true, category: true, note: true, transactionDate: true },
      }),
    ]);

    let periodIncome = 0;
    let periodExpense = 0;
    for (const pt of periodTypes) {
      const amt = pt._sum.amount ? Number(pt._sum.amount) : 0;
      if (pt.type === 'INCOME') periodIncome = amt;
      else if (pt.type === 'EXPENSE') periodExpense = amt;
    }

    const filteredTotal = filterAgg._sum.amount ? Number(filterAgg._sum.amount) : 0;
    const filteredCount = filterAgg._count.id || 0;
    const averageAmount = filterAgg._avg.amount ? Math.round(Number(filterAgg._avg.amount)) : 0;
    const maxAmount = filterAgg._max.amount ? Number(filterAgg._max.amount) : 0;

    // Percentage of period expense
    const percentageOfPeriodExpense =
      periodExpense > 0 && filteredTotal > 0
        ? Math.min(Math.round((filteredTotal / periodExpense) * 1000) / 10, 100)
        : 0;

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
      periodSummary: {
        income: periodIncome,
        expense: periodExpense,
        netCashflow: Number(new Decimal(periodIncome).minus(new Decimal(periodExpense)).toNumber()),
      },
      filteredStats: {
        totalAmount: filteredTotal,
        count: filteredCount,
        averageAmount,
        maxAmount,
        maxTransactionNote: maxTx ? (maxTx.note || maxTx.category) : undefined,
        percentageOfPeriodExpense,
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
        targetType === 'TRANSFER'
          ? (input.destinationWalletId !== undefined ? input.destinationWalletId : existing.destinationWalletId)
          : null;

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
      } else if (existing.type === 'TRANSFER' && existing.destinationWalletId && existing.destinationWalletId !== existing.walletId) {
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
   * 8. Financial Summary (Total balance, period income, period expense, category breakdown)
   * High-performance aggregation using database-level indexes and SUM/GROUP BY
   * Cached via Cache-Aside SWR
   */
  async getFinanceSummary(
    userId: string,
    filter?: {
      startDate?: string;
      endDate?: string;
      month?: number;
      year?: number;
      allTime?: boolean;
    }
  ) {
    const cacheKey = `cache:finance-summary:${userId}:${filter?.year ?? ''}:${filter?.month ?? ''}:${filter?.startDate ?? ''}:${filter?.endDate ?? ''}:${filter?.allTime ? 'all' : ''}`;

    return cacheService.remember(cacheKey, 60, async () => {
      const dateRange = this.parseDateRange(filter);
      const txWhere: any = { userId };
      if (dateRange) {
        txWhere.transactionDate = dateRange;
      }

      // Parallel DB-level aggregations utilizing PostgreSQL B-Tree composite indexes
      const [walletAgg, typeAggregates, categoryAggregates] = await Promise.all([
        prisma.wallet.aggregate({
          where: { userId },
          _sum: { currentBalance: true },
          _count: { id: true },
        }),
        prisma.transaction.groupBy({
          by: ['type'],
          where: txWhere,
          _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
          by: ['category'],
          where: {
            ...txWhere,
            type: 'EXPENSE',
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
   * Single roundtrip replacing separate HTTP requests
   */
  async getFinanceOverview(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      month?: number;
      year?: number;
      startDate?: string;
      endDate?: string;
      allTime?: boolean;
      walletId?: string;
      category?: string;
      type?: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ALL';
      search?: string;
    }
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const cacheKey = `cache:finance-overview:${userId}:${page}:${limit}:${options?.year ?? ''}:${options?.month ?? ''}:${options?.startDate ?? ''}:${options?.endDate ?? ''}:${options?.allTime ? 'all' : ''}:${options?.category ?? ''}:${options?.walletId ?? ''}:${options?.type ?? ''}:${options?.search ?? ''}`;

    return cacheService.remember(cacheKey, 30, async () => {
      const [wallets, categories, summary, transactions] = await Promise.all([
        this.getWallets(userId),
        this.getCategories(userId),
        this.getFinanceSummary(userId, options),
        this.getTransactions(userId, options),
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
   * 9. Get all categories for user
   */
  async getCategories(userId: string) {
    return prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 10. Create a custom category
   */
  async createCategory(userId: string, input: CreateCategoryInput) {
    const created = await prisma.category.create({
      data: {
        userId,
        name: input.name,
        type: input.type,
        icon: input.icon,
        color: input.color,
      },
    });

    await this.invalidateUserFinanceCache(userId);
    return created;
  }

  /**
   * 11. Update category & cascade update transactions historical records
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

    await this.invalidateUserFinanceCache(userId);
    return updated;
  }

  /**
   * 12. Delete category
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

    await this.invalidateUserFinanceCache(userId);
    return { message: 'Đã xóa danh mục thành công.' };
  }
}

export const financeService = new FinanceService();
