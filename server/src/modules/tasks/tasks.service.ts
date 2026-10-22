import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { cacheService } from '../../services/cache.service';
import {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterInput,
  RenameTaskTagInput,
  DeleteTaskTagInput,
  UpdateTaskTagColorInput,
  CreateSubtaskInput,
  UpdateSubtaskInput,
  ReorderSubtasksInput,
} from './tasks.schema';
import { getDefaultTagColor } from '../../utils/tagColors';

export class TasksService {
  /**
   * 1. Get tasks with intelligent filtering & pagination (T2.1)
   */
  async getTasks(userId: string, filterInput?: Partial<TaskFilterInput>) {
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
    } else if (filterInput?.filter === 'urgent') {
      where.priority = 'URGENT';
      where.status = { not: 'DONE' };
    } else if (filterInput?.filter === 'done') {
      where.status = 'DONE';
    }

    if (filterInput?.tag) {
      where.tags = {
        array_contains: filterInput.tag,
      };
    }

    if (filterInput?.search?.trim()) {
      const q = filterInput.search.trim();
      const searchCondition = [
        { title: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchCondition }];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
    }

    const limit = Math.min(Math.max(filterInput?.limit ? Number(filterInput.limit) : 20, 1), 1000);
    const page = filterInput?.page ? Math.max(Number(filterInput.page), 1) : 1;
    const skip =
      filterInput?.offset !== undefined
        ? Math.max(Number(filterInput.offset), 0)
        : (page - 1) * limit;
    const currentPage =
      filterInput?.offset !== undefined ? Math.floor(skip / limit) + 1 : page;

    const cacheKey = `cache:tasks:${userId}:${filterInput?.filter || 'all'}:${filterInput?.tag || ''}:${filterInput?.search || ''}:${currentPage}:${limit}`;

    return cacheService.remember(cacheKey, 60, async () => {
      const [total, items] = await Promise.all([
        prisma.task.count({ where }),
        prisma.task.findMany({
          where,
          include: {
            subtasks: {
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { priority: 'desc' }],
          take: limit,
          skip,
        }),
      ]);

      const computedTotalPages = Math.ceil(total / limit) || 1;

      return {
        items,
        pagination: {
          page: currentPage,
          limit,
          total,
          totalPages: computedTotalPages,
          hasNext: currentPage < computedTotalPages,
          hasPrev: currentPage > 1,
        },
      };
    });
  }

  /**
   * Invalidate tasks and dashboard caches for user
   */
  async invalidateUserTasksCache(userId: string) {
    await Promise.all([
      cacheService.del(`cache:dashboard:${userId}`),
      cacheService.delPattern(`cache:tasks:${userId}*`),
    ]);
  }

  /**
   * 2. Create task
   */
  async createTask(userId: string, input: CreateTaskInput) {
    const subtaskData =
      input.subtasks && input.subtasks.length > 0
        ? {
            create: input.subtasks.map((stTitle, idx) => ({
              title: stTitle.trim(),
              orderIndex: idx,
            })),
          }
        : undefined;

    const task = await prisma.task.create({
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
        subtasks: subtaskData,
      },
      include: {
        subtasks: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    await this.invalidateUserTasksCache(userId);
    return task;
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
    if (input.title !== undefined) {
      data.title = input.title.trim();
    }
    if (input.description !== undefined) {
      data.description = input.description ? input.description.trim() : null;
    }
    if (input.dueDate !== undefined) {
      data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }
    if (input.isRecurring === false) {
      data.recurrenceRule = null;
    }

    if (input.status === 'DONE' && task.status !== 'DONE') {
      data.completedAt = new Date();
      // If completing parent task, mark all existing subtasks as completed
      await prisma.subtask.updateMany({
        where: { taskId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    } else if (input.status && input.status !== 'DONE' && task.status === 'DONE') {
      data.completedAt = null;
      // If unticking / reopening parent task, reset all subtasks to incomplete
      await prisma.subtask.updateMany({
        where: { taskId },
        data: {
          isCompleted: false,
          completedAt: null,
        },
      });
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        subtasks: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    await this.invalidateUserTasksCache(userId);
    return updated;
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

    if (willBeDone) {
      // If completing parent task, mark all existing subtasks as completed
      await prisma.subtask.updateMany({
        where: { taskId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    } else {
      // If unticking / reopening parent task, reset all existing subtasks to incomplete
      await prisma.subtask.updateMany({
        where: { taskId },
        data: {
          isCompleted: false,
          completedAt: null,
        },
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: willBeDone ? 'DONE' : 'TODO',
        completedAt: willBeDone ? new Date() : null,
      },
      include: {
        subtasks: {
          orderBy: { orderIndex: 'asc' },
        },
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

    await this.invalidateUserTasksCache(userId);

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
    await this.invalidateUserTasksCache(userId);
    return { message: 'Đã xóa công việc thành công.' };
  }

  /**
   * 6. Smart Priority To-Do for Unified Dashboard Widget (T4.2)
   * Priority: Overdue -> Today -> High Priority
   */
  async getTopPriorityTasks(userId: string, limit = 5) {
    return prisma.task.findMany({
      where: {
        userId,
        status: { not: 'DONE' },
      },
      include: {
        subtasks: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
      take: limit,
    });
  }

  /**
   * 7. Get all unique task tags with task count and color
   */
  async getTags(userId: string) {
    const [tasks, tagRecords] = await Promise.all([
      prisma.task.findMany({
        where: { userId },
        select: { tags: true },
      }),
      prisma.tag.findMany({
        where: { userId, type: 'TASK' },
      }),
    ]);

    const colorMap = new Map<string, string>();
    for (const record of tagRecords) {
      colorMap.set(record.name.toLowerCase().trim(), record.color);
    }

    const tagCounts: Record<string, number> = {};
    for (const t of tasks) {
      const tags = (t.tags as string[]) || [];
      for (const tag of tags) {
        if (!tag) continue;
        const normalized = tag.toLowerCase().trim();
        tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
      }
    }

    return Object.entries(tagCounts)
      .map(([name, count]) => ({
        name,
        count,
        color: colorMap.get(name) || getDefaultTagColor(name),
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  /**
   * 8. Update task tag color
   */
  async updateTagColor(userId: string, input: UpdateTaskTagColorInput) {
    const cleanTag = input.tag.toLowerCase().trim().replace(/^#/, '');
    const tagRecord = await prisma.tag.upsert({
      where: {
        userId_type_name: {
          userId,
          type: 'TASK',
          name: cleanTag,
        },
      },
      create: {
        userId,
        type: 'TASK',
        name: cleanTag,
        color: input.color,
      },
      update: {
        color: input.color,
      },
    });

    await this.invalidateUserTasksCache(userId);
    return tagRecord;
  }

  /**
   * 9. Rename task tag across all tasks of user
   */
  async renameTag(userId: string, input: RenameTaskTagInput) {
    const { oldTag, newTag } = input;
    const cleanOld = oldTag.toLowerCase().trim();
    const cleanNew = newTag.toLowerCase().trim().replace(/^#/, '');

    const tasks = await prisma.task.findMany({
      where: { userId },
      select: { id: true, tags: true },
    });

    const tasksToUpdate = tasks.filter((t) => {
      const tags = (t.tags as string[]) || [];
      return tags.some((tag) => tag.toLowerCase().trim() === cleanOld);
    });

    if (tasksToUpdate.length > 0) {
      const updates = tasksToUpdate.map((t) => {
        const tags = (t.tags as string[]) || [];
        const updatedTags = Array.from(
          new Set(
            tags.map((tag) => (tag.toLowerCase().trim() === cleanOld ? cleanNew : tag))
          )
        );
        return prisma.task.update({
          where: { id: t.id },
          data: { tags: updatedTags },
        });
      });
      await prisma.$transaction(updates);
    }

    // Sync in Tag table
    const existingTag = await prisma.tag.findUnique({
      where: {
        userId_type_name: { userId, type: 'TASK', name: cleanOld },
      },
    });

    if (existingTag) {
      await prisma.tag.delete({ where: { id: existingTag.id } });
      await prisma.tag.upsert({
        where: {
          userId_type_name: { userId, type: 'TASK', name: cleanNew },
        },
        create: {
          userId,
          type: 'TASK',
          name: cleanNew,
          color: existingTag.color,
        },
        update: {
          color: existingTag.color,
        },
      });
    }

    await this.invalidateUserTasksCache(userId);
    return { updatedCount: tasksToUpdate.length, oldTag: cleanOld, newTag: cleanNew };
  }

  /**
   * 10. Delete task tag across all tasks of user
   */
  async deleteTag(userId: string, input: DeleteTaskTagInput) {
    const { tag } = input;
    const cleanTag = tag.toLowerCase().trim();

    const tasks = await prisma.task.findMany({
      where: { userId },
      select: { id: true, tags: true },
    });

    const tasksToUpdate = tasks.filter((t) => {
      const tags = (t.tags as string[]) || [];
      return tags.some((tg) => tg.toLowerCase().trim() === cleanTag);
    });

    if (tasksToUpdate.length > 0) {
      const updates = tasksToUpdate.map((t) => {
        const tags = (t.tags as string[]) || [];
        const updatedTags = tags.filter((tg) => tg.toLowerCase().trim() !== cleanTag);
        return prisma.task.update({
          where: { id: t.id },
          data: { tags: updatedTags },
        });
      });
      await prisma.$transaction(updates);
    }

    await prisma.tag.deleteMany({
      where: { userId, type: 'TASK', name: cleanTag },
    });

    await this.invalidateUserTasksCache(userId);
    return { updatedCount: tasksToUpdate.length, tag: cleanTag };
  }

  /**
   * Helper: Verify task belongs to current user to prevent IDOR attacks
   */
  async verifyTaskOwnership(userId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true, userId: true },
    });

    if (!task) {
      throw new AppError('Không tìm thấy công việc hoặc bạn không có quyền truy cập.', 404);
    }

    return task;
  }

  /**
   * 11. Create Subtask for a Task
   */
  async createSubtask(userId: string, taskId: string, input: CreateSubtaskInput) {
    await this.verifyTaskOwnership(userId, taskId);

    const maxOrder = await prisma.subtask.findFirst({
      where: { taskId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });

    const nextOrder = maxOrder ? maxOrder.orderIndex + 1 : 0;

    const subtask = await prisma.subtask.create({
      data: {
        taskId,
        title: input.title.trim(),
        orderIndex: nextOrder,
      },
    });

    await this.invalidateUserTasksCache(userId);
    return subtask;
  }

  /**
   * 12. Update Subtask (Title or Completion state)
   */
  async updateSubtask(userId: string, taskId: string, subtaskId: string, input: UpdateSubtaskInput) {
    await this.verifyTaskOwnership(userId, taskId);

    const subtask = await prisma.subtask.findFirst({
      where: { id: subtaskId, taskId },
    });

    if (!subtask) {
      throw new AppError('Không tìm thấy việc con yêu cầu.', 404);
    }

    const data: any = {};
    if (input.title !== undefined) {
      data.title = input.title.trim();
    }
    if (input.isCompleted !== undefined) {
      data.isCompleted = input.isCompleted;
      data.completedAt = input.isCompleted ? new Date() : null;
    }

    const updated = await prisma.subtask.update({
      where: { id: subtaskId },
      data,
    });

    // Check Auto-completion of parent task if isCompleted changed
    let parentTaskUpdated = false;
    let parentTaskStatus: string | null = null;

    if (input.isCompleted !== undefined) {
      const allSubtasks = await prisma.subtask.findMany({
        where: { taskId },
      });
      const allDone = allSubtasks.length > 0 && allSubtasks.every((st) => st.isCompleted);
      const parentTask = await prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, status: true },
      });

      if (allDone && parentTask && parentTask.status !== 'DONE') {
        await prisma.task.update({
          where: { id: taskId },
          data: {
            status: 'DONE',
            completedAt: new Date(),
          },
        });
        parentTaskStatus = 'DONE';
        parentTaskUpdated = true;
      } else if (!allDone && parentTask && parentTask.status === 'DONE') {
        await prisma.task.update({
          where: { id: taskId },
          data: {
            status: 'IN_PROGRESS',
            completedAt: null,
          },
        });
        parentTaskStatus = 'IN_PROGRESS';
        parentTaskUpdated = true;
      }
    }

    await this.invalidateUserTasksCache(userId);
    return {
      ...updated,
      parentTaskUpdated,
      parentTaskStatus,
    };
  }

  /**
   * 13. Fast Toggle Subtask Completion State & Trigger Parent Auto-complete
   */
  async toggleSubtask(userId: string, taskId: string, subtaskId: string) {
    await this.verifyTaskOwnership(userId, taskId);

    const subtask = await prisma.subtask.findFirst({
      where: { id: subtaskId, taskId },
    });

    if (!subtask) {
      throw new AppError('Không tìm thấy việc con yêu cầu.', 404);
    }

    const nextState = !subtask.isCompleted;
    const updated = await prisma.subtask.update({
      where: { id: subtaskId },
      data: {
        isCompleted: nextState,
        completedAt: nextState ? new Date() : null,
      },
    });

    // Auto-completion check for Parent Task
    const allSubtasks = await prisma.subtask.findMany({
      where: { taskId },
    });
    const allDone = allSubtasks.length > 0 && allSubtasks.every((st) => st.isCompleted);
    const parentTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, status: true },
    });

    let parentTaskUpdated = false;
    let parentTaskStatus: string | null = null;

    if (allDone && parentTask && parentTask.status !== 'DONE') {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'DONE',
          completedAt: new Date(),
        },
      });
      parentTaskStatus = 'DONE';
      parentTaskUpdated = true;
    } else if (!allDone && parentTask && parentTask.status === 'DONE') {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'IN_PROGRESS',
          completedAt: null,
        },
      });
      parentTaskStatus = 'IN_PROGRESS';
      parentTaskUpdated = true;
    }

    await this.invalidateUserTasksCache(userId);
    return {
      ...updated,
      parentTaskUpdated,
      parentTaskStatus,
    };
  }

  /**
   * 14. Delete Subtask
   */
  async deleteSubtask(userId: string, taskId: string, subtaskId: string) {
    await this.verifyTaskOwnership(userId, taskId);

    const subtask = await prisma.subtask.findFirst({
      where: { id: subtaskId, taskId },
    });

    if (!subtask) {
      throw new AppError('Không tìm thấy việc con yêu cầu.', 404);
    }

    await prisma.subtask.delete({
      where: { id: subtaskId },
    });

    await this.invalidateUserTasksCache(userId);
    return { message: 'Đã xóa việc con thành công.' };
  }

  /**
   * 15. Reorder Subtasks
   */
  async reorderSubtasks(userId: string, taskId: string, input: ReorderSubtasksInput) {
    await this.verifyTaskOwnership(userId, taskId);

    const updates = input.subtaskIds.map((subtaskId, index) =>
      prisma.subtask.updateMany({
        where: { id: subtaskId, taskId },
        data: { orderIndex: index },
      })
    );

    await prisma.$transaction(updates);
    await this.invalidateUserTasksCache(userId);

    const currentSubtasks = await prisma.subtask.findMany({
      where: { taskId },
      orderBy: { orderIndex: 'asc' },
    });

    return { message: 'Đã cập nhật thứ tự việc con thành công.', subtasks: currentSubtasks };
  }
}

export const tasksService = new TasksService();
