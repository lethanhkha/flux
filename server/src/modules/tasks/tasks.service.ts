import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { CreateTaskInput, UpdateTaskInput, TaskFilterInput } from './tasks.schema';

export class TasksService {
  /**
   * 1. Get tasks with intelligent filtering
   */
  async getTasks(userId: string, filterInput?: TaskFilterInput) {
    const where: any = { userId };
    const now = new Date();

    if (filterInput?.status) {
      where.status = filterInput.status;
    }

    if (filterInput?.priority) {
      where.priority = filterInput.priority;
    }

    if (filterInput?.filter === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      where.dueDate = { gte: startOfDay, lte: endOfDay };
    } else if (filterInput?.filter === 'next7days') {
      const endOfNext7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.dueDate = { gte: now, lte: endOfNext7Days };
    } else if (filterInput?.filter === 'overdue') {
      where.dueDate = { lt: now };
      where.status = { not: 'DONE' };
    } else if (filterInput?.filter === 'done') {
      where.status = 'DONE';
    }

    if (filterInput?.tag) {
      where.tags = {
        array_contains: filterInput.tag,
      };
    }

    return prisma.task.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { priority: 'desc' }],
    });
  }

  /**
   * 2. Create task
   */
  async createTask(userId: string, input: CreateTaskInput) {
    return prisma.task.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        isRecurring: input.isRecurring,
        recurrenceRule: input.recurrenceRule,
        tags: input.tags || [],
      },
    });
  }

  /**
   * 3. Update task
   */
  async updateTask(userId: string, taskId: string, input: UpdateTaskInput) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new AppError('Không tìm thấy công việc.', 404);
    }

    const data: any = { ...input };
    if (input.dueDate !== undefined) {
      data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }

    if (input.status === 'DONE' && task.status !== 'DONE') {
      data.completedAt = new Date();
    } else if (input.status && input.status !== 'DONE') {
      data.completedAt = null;
    }

    return prisma.task.update({
      where: { id: taskId },
      data,
    });
  }

  /**
   * 4. Toggle Task Completion & Trigger Recurring Task Engine (T6.3)
   */
  async toggleTaskComplete(userId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new AppError('Không tìm thấy công việc.', 404);
    }

    const willBeDone = task.status !== 'DONE';

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: willBeDone ? 'DONE' : 'TODO',
        completedAt: willBeDone ? new Date() : null,
      },
    });

    // Recurring Task Engine: If recurring task is completed, spawn next task instance
    let nextRecurringTask = null;
    if (willBeDone && task.isRecurring && task.recurrenceRule) {
      const baseDue = task.dueDate ? new Date(task.dueDate) : new Date();
      let nextDue = new Date(baseDue);

      if (task.recurrenceRule === 'DAILY') {
        nextDue.setDate(nextDue.getDate() + 1);
      } else if (task.recurrenceRule === 'WEEKLY') {
        nextDue.setDate(nextDue.getDate() + 7);
      } else if (task.recurrenceRule === 'MONTHLY') {
        nextDue.setMonth(nextDue.getMonth() + 1);
      }

      nextRecurringTask = await prisma.task.create({
        data: {
          userId,
          title: task.title,
          description: task.description,
          status: 'TODO',
          priority: task.priority,
          dueDate: nextDue,
          isRecurring: true,
          recurrenceRule: task.recurrenceRule,
          tags: task.tags || [],
        },
      });
    }

    return {
      task: updatedTask,
      nextRecurringTask,
    };
  }

  /**
   * 5. Delete task
   */
  async deleteTask(userId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new AppError('Không tìm thấy công việc.', 404);
    }

    await prisma.task.delete({ where: { id: taskId } });
    return { message: 'Đã xóa công việc thành công.' };
  }

  /**
   * 6. Smart Priority To-Do for Unified Dashboard Widget (T4.2)
   * Priority: Overdue -> Today -> High Priority
   */
  async getTopPriorityTasks(userId: string, limit = 5) {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    return prisma.task.findMany({
      where: {
        userId,
        status: { not: 'DONE' },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
      take: limit,
    });
  }
}

export const tasksService = new TasksService();
