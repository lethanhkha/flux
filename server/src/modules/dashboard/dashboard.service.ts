import { financeService } from '../finance/finance.service';
import { tasksService } from '../tasks/tasks.service';
import { notesService } from '../notes/notes.service';

export class DashboardService {
  /**
   * Aggregate 3 core widgets in a single sub-50ms roundtrip (T4.1, T4.2, T4.3)
   */
  async getUnifiedDashboard(userId: string) {
    const [financeSummary, wallets, priorityTasks, pinnedNotes] = await Promise.all([
      financeService.getFinanceSummary(userId),
      financeService.getWallets(userId),
      tasksService.getTopPriorityTasks(userId, 5),
      notesService.getPinnedNotes(userId, 3),
    ]);

    return {
      finance: {
        totalBalance: financeSummary.totalBalance,
        monthlyIncome: financeSummary.monthlyIncome,
        monthlyExpense: financeSummary.monthlyExpense,
        netCashflow: financeSummary.netCashflow,
        activeWalletsCount: wallets.length,
      },
      priorityTasks,
      pinnedNotes,
    };
  }
}

export const dashboardService = new DashboardService();
