import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Protect dashboard route with JWT authentication
router.use(authenticate);

router.get('/', dashboardController.getDashboard);

export default router;
