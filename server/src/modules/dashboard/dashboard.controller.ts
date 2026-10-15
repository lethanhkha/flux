import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';

export class DashboardController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getUnifiedDashboard(req.user!.userId);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
