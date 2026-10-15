import { Router } from 'express';
import { financeController } from './finance.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Protect all finance routes with JWT authentication
router.use(authenticate);

// Wallet endpoints
router.get('/wallets', financeController.getWallets);
router.post('/wallets', financeController.createWallet);
router.patch('/wallets/:id', financeController.updateWallet);
router.delete('/wallets/:id', financeController.deleteWallet);

// Transaction endpoints
router.get('/transactions', financeController.getTransactions);
router.post('/transactions', financeController.createTransaction);
router.post('/transfer', financeController.transferMoney);

// Financial summary endpoint
router.get('/summary', financeController.getSummary);

export default router;
