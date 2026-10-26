import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { cacheService } from '../../services/cache.service';
import { getDefaultTagColor } from '../../utils/tagColors';
import {
  CreateReminderInput,
  UpdateReminderInput,
  ReminderFilterInput,
  RenameReminderTagInput,
  DeleteReminderTagInput,
  UpdateReminderTagColorInput,
} from './reminders.schema';

export class RemindersService {
  /**
   * 1. Create a new reminder
   */
  async createReminder(userId: string, input: CreateReminderInput) {
    const scheduledAt = new Date(input.scheduledAt);

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        scheduledAt,
        remindBefore: input.remindBefore ?? 0,
        location: input.location,
        isRecurring: input.isRecurring ?? false,
        recurrenceRule: input.recurrenceRule,
        tags: input.tags ?? [],
        status: 'SCHEDULED',
      },
    });

    await cacheService.del(`cache:dashboard:${userId}`);
    return reminder;
  }

  /**
   * 2. Get reminders with filtering and pagination
   */
  async getReminders(userId: string, filterInput?: ReminderFilterInput) {
    const where: any = { userId };
    const now = new Date();

    if (filterInput?.status) {
      where.status = filterInput.status;
    }

    if (filterInput?.filter === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      where.scheduledAt = { gte: startOfDay, lte: endOfDay };
    } else if (filterInput?.filter === 'upcoming') {
      where.scheduledAt = { gte: now };
      if (!filterInput.status) {
        where.status = { in: ['SCHEDULED', 'SNOOZED'] };
      }
    } else if (filterInput?.filter === 'past') {
      where.OR = [
        { scheduledAt: { lt: now } },
        { status: { in: ['COMPLETED', 'MISSED'] } },
      ];
    }

    if (filterInput?.search) {
      const searchTerm = filterInput.search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { location: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      ];
    }

    let filterTags: string[] = [];
    if (filterInput?.tags && filterInput.tags.length > 0) {
      filterTags = filterInput.tags;
    } else if (filterInput?.tag?.trim()) {
      filterTags = [filterInput.tag.trim()];
    }

    let filterExcludeTags: string[] = [];
    if (filterInput?.excludeTags && filterInput.excludeTags.length > 0) {
      filterExcludeTags = filterInput.excludeTags;
    }

    const andConditions: any[] = where.AND || [];

    if (filterTags.length === 1) {
      andConditions.push({
        tags: {
          array_contains: filterTags[0],
        },
      });
    } else if (filterTags.length > 1) {
      andConditions.push({
        OR: filterTags.map((tag) => ({
          tags: {
            array_contains: tag,
          },
        })),
      });
    }

    if (filterExcludeTags.length > 0) {
      andConditions.push({
        NOT: filterExcludeTags.map((tag) => ({
          tags: {
            array_contains: tag,
          },
        })),
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const page = Math.max(1, Number(filterInput?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filterInput?.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
      }),
      prisma.reminder.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 3. Get due reminders for real-time alerts
   * Fetches reminders where either:
   *  - status is SNOOZED and snoozedUntil <= now
   *  - status is SCHEDULED and (scheduledAt - remindBefore minutes) <= now, within a reasonable recent window (e.g. within last 2 hours)
   */
  async getDueReminders(userId: string) {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const candidates = await prisma.reminder.findMany({
      where: {
        userId,
        status: { in: ['SCHEDULED', 'SNOOZED'] },
        OR: [
          { scheduledAt: { gte: twoHoursAgo } },
          { status: 'SNOOZED' },
        ],
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const dueReminders = candidates.filter((item) => {
      if (item.status === 'SNOOZED' && item.snoozedUntil) {
        return new Date(item.snoozedUntil) <= now;
      }

      if (item.status === 'SCHEDULED') {
        const triggerTime = new Date(item.scheduledAt.getTime() - (item.remindBefore || 0) * 60000);
        return triggerTime <= now && triggerTime >= twoHoursAgo;
      }

      return false;
    });

    return dueReminders;
  }

  /**
   * 4. Get a single reminder by ID
   */
  async getReminderById(userId: string, id: string) {
    const reminder = await prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!reminder) {
      throw new AppError('Không tìm thấy nhắc hẹn', 404);
    }

    return reminder;
  }

  /**
   * 5. Update reminder details
   */
  async updateReminder(userId: string, id: string, input: UpdateReminderInput) {
    await this.getReminderById(userId, id);

    const data: any = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.scheduledAt !== undefined) data.scheduledAt = new Date(input.scheduledAt);
    if (input.remindBefore !== undefined) data.remindBefore = input.remindBefore;
    if (input.location !== undefined) data.location = input.location;
    if (input.status !== undefined) data.status = input.status;
    if (input.isRecurring !== undefined) data.isRecurring = input.isRecurring;
    if (input.recurrenceRule !== undefined) data.recurrenceRule = input.recurrenceRule;
    if (input.tags !== undefined) data.tags = input.tags;

    const updated = await prisma.reminder.update({
      where: { id },
      data,
    });

    await cacheService.del(`cache:dashboard:${userId}`);
    return updated;
  }

  /**
   * 6. Snooze a reminder by X minutes
   */
  async snoozeReminder(userId: string, id: string, minutes: number = 10) {
    await this.getReminderById(userId, id);
    const snoozeDurationMs = Math.max(1, minutes) * 60 * 1000;
    const snoozedUntil = new Date(Date.now() + snoozeDurationMs);

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        status: 'SNOOZED',
        snoozedUntil,
        lastAlertedAt: new Date(),
      },
    });

    await cacheService.del(`cache:dashboard:${userId}`);
    return updated;
  }

  /**
   * 7. Complete / Acknowledge a reminder
   * Handles recurring rules if applicable
   */
  async completeReminder(userId: string, id: string) {
    const existing = await this.getReminderById(userId, id);

    if (existing.isRecurring && existing.recurrenceRule) {
      const currentScheduled = new Date(existing.scheduledAt);
      let nextScheduled = new Date(currentScheduled);

      if (existing.recurrenceRule === 'DAILY') {
        nextScheduled.setDate(nextScheduled.getDate() + 1);
      } else if (existing.recurrenceRule === 'WEEKLY') {
        nextScheduled.setDate(nextScheduled.getDate() + 7);
      } else if (existing.recurrenceRule === 'MONTHLY') {
        nextScheduled.setMonth(nextScheduled.getMonth() + 1);
      }

      // If next time is still in the past, roll it forward past today
      const now = new Date();
      while (nextScheduled <= now) {
        if (existing.recurrenceRule === 'DAILY') {
          nextScheduled.setDate(nextScheduled.getDate() + 1);
        } else if (existing.recurrenceRule === 'WEEKLY') {
          nextScheduled.setDate(nextScheduled.getDate() + 7);
        } else if (existing.recurrenceRule === 'MONTHLY') {
          nextScheduled.setMonth(nextScheduled.getMonth() + 1);
        }
      }

      const updated = await prisma.reminder.update({
        where: { id },
        data: {
          scheduledAt: nextScheduled,
          status: 'SCHEDULED',
          snoozedUntil: null,
          lastAlertedAt: null,
        },
      });

      await cacheService.del(`cache:dashboard:${userId}`);
      return updated;
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        snoozedUntil: null,
      },
    });

    await cacheService.del(`cache:dashboard:${userId}`);
    return updated;
  }

  /**
   * 8. Delete a reminder
   */
  async deleteReminder(userId: string, id: string) {
    await this.getReminderById(userId, id);

    await prisma.reminder.delete({
      where: { id },
    });

    await cacheService.del(`cache:dashboard:${userId}`);
    return { success: true };
  }

  /**
   * 9. Get upcoming reminders for dashboard (next 24 hours / today)
   */
  async getUpcomingRemindersForDashboard(userId: string, limit: number = 5) {
    const now = new Date();
    const endOfNext24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return prisma.reminder.findMany({
      where: {
        userId,
        status: { in: ['SCHEDULED', 'SNOOZED'] },
        scheduledAt: {
          gte: new Date(now.getTime() - 15 * 60 * 1000), // Include events starting right now/recently
          lte: endOfNext24Hours,
        },
      },
      take: limit,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /**
   * 10. Get all unique tags for reminders with count and assigned color
   */
  async getTags(userId: string) {
    const [reminders, tagRecords] = await Promise.all([
      prisma.reminder.findMany({
        where: { userId },
        select: { tags: true },
      }),
      prisma.tag.findMany({
        where: { userId, type: 'REMINDER' },
      }),
    ]);

    const colorMap = new Map<string, string>();
    for (const record of tagRecords) {
      colorMap.set(record.name.toLowerCase().trim(), record.color);
    }

    const tagCounts: Record<string, number> = {};
    for (const r of reminders) {
      const tags = (r.tags as string[]) || [];
      for (const tag of tags) {
        if (!tag) continue;
        const normalized = tag.toLowerCase().trim();
        tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
      }
    }

    for (const record of tagRecords) {
      const normalized = record.name.toLowerCase().trim();
      if (tagCounts[normalized] === undefined) {
        tagCounts[normalized] = 0;
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
   * 11. Update tag color
   */
  async updateTagColor(userId: string, input: UpdateReminderTagColorInput) {
    const cleanTag = input.tag.toLowerCase().trim().replace(/^#/, '');

    const tagRecord = await prisma.tag.upsert({
      where: {
        userId_type_name: {
          userId,
          type: 'REMINDER',
          name: cleanTag,
        },
      },
      create: {
        userId,
        type: 'REMINDER',
        name: cleanTag,
        color: input.color,
      },
      update: {
        color: input.color,
      },
    });

    return tagRecord;
  }

  /**
   * 12. Rename a tag across all reminders of user
   */
  async renameTag(userId: string, input: RenameReminderTagInput) {
    const { oldTag, newTag } = input;
    const cleanOld = oldTag.toLowerCase().trim().replace(/^#/, '');
    const cleanNew = newTag.toLowerCase().trim().replace(/^#/, '');

    const reminders = await prisma.reminder.findMany({
      where: { userId },
      select: { id: true, tags: true },
    });

    const remindersToUpdate = reminders.filter((r) => {
      const tags = (r.tags as string[]) || [];
      return tags.some((tag) => tag.toLowerCase().trim() === cleanOld);
    });

    if (remindersToUpdate.length > 0) {
      const updates = remindersToUpdate.map((r) => {
        const tags = (r.tags as string[]) || [];
        const updatedTags = Array.from(
          new Set(
            tags.map((tag) => (tag.toLowerCase().trim() === cleanOld ? cleanNew : tag))
          )
        );
        return prisma.reminder.update({
          where: { id: r.id },
          data: { tags: updatedTags },
        });
      });
      await prisma.$transaction(updates);
    }

    // Sync in Tag table
    const existingTag = await prisma.tag.findUnique({
      where: {
        userId_type_name: {
          userId,
          type: 'REMINDER',
          name: cleanOld,
        },
      },
    });

    if (existingTag) {
      await prisma.tag.delete({ where: { id: existingTag.id } });
      await prisma.tag.upsert({
        where: {
          userId_type_name: {
            userId,
            type: 'REMINDER',
            name: cleanNew,
          },
        },
        create: {
          userId,
          type: 'REMINDER',
          name: cleanNew,
          color: existingTag.color,
        },
        update: {
          color: existingTag.color,
        },
      });
    }

    return {
      updatedCount: remindersToUpdate.length,
      oldTag: cleanOld,
      newTag: cleanNew,
    };
  }

  /**
   * 13. Delete a tag across all reminders of user
   */
  async deleteTag(userId: string, input: DeleteReminderTagInput) {
    const { tag } = input;
    const cleanTag = tag.toLowerCase().trim().replace(/^#/, '');

    const reminders = await prisma.reminder.findMany({
      where: { userId },
      select: { id: true, tags: true },
    });

    const remindersToUpdate = reminders.filter((r) => {
      const tags = (r.tags as string[]) || [];
      return tags.some((tg) => tg.toLowerCase().trim() === cleanTag);
    });

    if (remindersToUpdate.length > 0) {
      const updates = remindersToUpdate.map((r) => {
        const tags = (r.tags as string[]) || [];
        const updatedTags = tags.filter((tg) => tg.toLowerCase().trim() !== cleanTag);
        return prisma.reminder.update({
          where: { id: r.id },
          data: { tags: updatedTags },
        });
      });
      await prisma.$transaction(updates);
    }

    await prisma.tag.deleteMany({
      where: {
        userId,
        type: 'REMINDER',
        name: cleanTag,
      },
    });

    return {
      updatedCount: remindersToUpdate.length,
      deletedTag: cleanTag,
    };
  }
}

export const remindersService = new RemindersService();
