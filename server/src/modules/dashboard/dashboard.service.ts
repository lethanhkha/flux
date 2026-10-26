import { financeService } from '../finance/finance.service';
import { tasksService } from '../tasks/tasks.service';
import { notesService } from '../notes/notes.service';
import { remindersService } from '../reminders/reminders.service';
import { cacheService } from '../../services/cache.service';

export class DashboardService {
  /**
   * Aggregate 4 core widgets in a single roundtrip with 60-second SWR cache
   * Under heavy load (500 VUs), serves sub-2ms cached responses from RAM.
   */
  async getUnifiedDashboard(userId: string) {
    const cacheKey = `cache:dashboard:${userId}`;

    return cacheService.remember(cacheKey, 60, async () => {
      const [financeSummary, priorityTasks, pinnedNotes, upcomingReminders] = await Promise.all([
        financeService.getFinanceSummary(userId),
        tasksService.getTopPriorityTasks(userId, 5),
        notesService.getPinnedNotes(userId, 3),
        remindersService.getUpcomingRemindersForDashboard(userId, 5),
      ]);

      return {
        finance: {
          totalBalance: financeSummary.totalBalance,
          monthlyIncome: financeSummary.monthlyIncome,
          monthlyExpense: financeSummary.monthlyExpense,
          netCashflow: financeSummary.netCashflow,
          activeWalletsCount: financeSummary.activeWalletsCount,
        },
        priorityTasks,
        pinnedNotes,
        upcomingReminders,
      };
    });
  }
}

export const dashboardService = new DashboardService();
