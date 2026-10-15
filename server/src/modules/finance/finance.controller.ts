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

  async deleteWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await financeService.deleteWallet(req.user!.userId, req.params.id);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { walletId, type, category, limit, offset } = req.query;
      const result = await financeService.getTransactions(req.user!.userId, {
        walletId: walletId as string,
        type: type as any,
        category: category as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
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
      const summary = await financeService.getFinanceSummary(req.user!.userId);
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
