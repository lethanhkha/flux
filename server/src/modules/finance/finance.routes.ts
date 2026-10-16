import { Router } from 'express';
import { financeController } from './finance.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Protect all finance routes with JWT authentication
router.use(authenticate);

// Consolidated overview endpoint (T2.3)
router.get('/overview', financeController.getFinanceOverview);

// Wallet endpoints
router.get('/wallets', financeController.getWallets);
router.post('/wallets', financeController.createWallet);
router.patch('/wallets/:id/default', financeController.setDefaultWallet);
router.patch('/wallets/:id', financeController.updateWallet);
router.delete('/wallets/:id', financeController.deleteWallet);

// Transaction endpoints
router.get('/transactions', financeController.getTransactions);
router.post('/transactions', financeController.createTransaction);
router.patch('/transactions/:id', financeController.updateTransaction);
router.delete('/transactions/:id', financeController.deleteTransaction);
router.post('/transfer', financeController.transferMoney);

// Category endpoints
router.get('/categories', financeController.getCategories);
router.post('/categories', financeController.createCategory);
router.patch('/categories/:id', financeController.updateCategory);
router.delete('/categories/:id', financeController.deleteCategory);

// Financial summary endpoint
router.get('/summary', financeController.getSummary);

export default router;
