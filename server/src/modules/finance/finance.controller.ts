import { Request, Response, NextFunction } from 'express';
import { financeService } from './finance.service';
import {
  createWalletSchema,
  updateWalletSchema,
  createTransactionSchema,
  updateTransactionSchema,
  transferMoneySchema,
  createCategorySchema,
  updateCategorySchema,
  getTransactionsQuerySchema,
  getFinanceSummaryQuerySchema,
} from './finance.schema';

export class FinanceController {
  async getWallets(req: Request, res: Response, next: NextFunction) {
    try {
      const wallets = await financeService.getWallets(req.user!.userId);
      res.status(200).json({ status: 'success', data: wallets });
    } catch (error) {
      next(error);
    }
  }

  async createWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createWalletSchema.parse(req.body);
      const wallet = await financeService.createWallet(req.user!.userId, validated);
      res.status(201).json({ status: 'success', data: wallet });
    } catch (error) {
      next(error);
    }
  }

  async updateWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateWalletSchema.parse(req.body);
      const wallet = await financeService.updateWallet(
        req.user!.userId,
        req.params.id,
        validated
      );
      res.status(200).json({ status: 'success', data: wallet });
    } catch (error) {
      next(error);
    }
  }

  async setDefaultWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const wallet = await financeService.setDefaultWallet(req.user!.userId, req.params.id);
      res.status(200).json({ status: 'success', data: wallet });
    } catch (error) {
      next(error);
    }
  }

  async deleteWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await financeService.deleteWallet(req.user!.userId, req.params.id);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getFinanceOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page,
        limit,
        month,
        year,
        startDate,
        endDate,
        allTime,
        walletId,
        category,
        type,
        search,
      } = req.query;

      const overview = await financeService.getFinanceOverview(req.user!.userId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        month: month ? parseInt(month as string, 10) : undefined,
        year: year ? parseInt(year as string, 10) : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
        allTime: allTime === 'true',
        walletId: walletId as string,
        category: category as string,
        type: type as any,
        search: search as string,
      });
      res.status(200).json({ status: 'success', data: overview });
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = getTransactionsQuerySchema.parse(req.query);
      const result = await financeService.getTransactions(req.user!.userId, {
        ...validated,
        allTime: req.query.allTime === 'true',
      });
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async createTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createTransactionSchema.parse(req.body);
      const transaction = await financeService.createTransaction(req.user!.userId, validated);
      res.status(201).json({ status: 'success', data: transaction });
    } catch (error) {
      next(error);
    }
  }

  async updateTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateTransactionSchema.parse(req.body);
      const transaction = await financeService.updateTransaction(
        req.user!.userId,
        req.params.id,
        validated
      );
      res.status(200).json({ status: 'success', data: transaction });
    } catch (error) {
      next(error);
    }
  }

  async deleteTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await financeService.deleteTransaction(
        req.user!.userId,
        req.params.id
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async transferMoney(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = transferMoneySchema.parse(req.body);
      const transaction = await financeService.transferMoney(req.user!.userId, validated);
      res.status(201).json({ status: 'success', data: transaction });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = getFinanceSummaryQuerySchema.parse(req.query);
      const summary = await financeService.getFinanceSummary(req.user!.userId, {
        ...validated,
        allTime: req.query.allTime === 'true',
      });
      res.status(200).json({ status: 'success', data: summary });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await financeService.getCategories(req.user!.userId);
      res.status(200).json({ status: 'success', data: categories });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createCategorySchema.parse(req.body);
      const category = await financeService.createCategory(req.user!.userId, validated);
      res.status(201).json({ status: 'success', data: category });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateCategorySchema.parse(req.body);
      const category = await financeService.updateCategory(
        req.user!.userId,
        req.params.id,
        validated
      );
      res.status(200).json({ status: 'success', data: category });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await financeService.deleteCategory(req.user!.userId, req.params.id);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const financeController = new FinanceController();
