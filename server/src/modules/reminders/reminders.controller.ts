import { Request, Response, NextFunction } from 'express';
import { remindersService } from './reminders.service';
import {
  createReminderSchema,
  updateReminderSchema,
  snoozeReminderSchema,
  reminderFilterSchema,
  renameReminderTagSchema,
  deleteReminderTagSchema,
  updateReminderTagColorSchema,
} from './reminders.schema';

export class RemindersController {
  async getReminders(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = reminderFilterSchema.parse(req.query);
      const result = await remindersService.getReminders(req.user!.userId, filter);
      res.status(200).json({
        status: 'success',
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDueReminders(req: Request, res: Response, next: NextFunction) {
    try {
      const dueReminders = await remindersService.getDueReminders(req.user!.userId);
      res.status(200).json({
        status: 'success',
        data: dueReminders,
      });
    } catch (error) {
      next(error);
    }
  }

  async getReminderById(req: Request, res: Response, next: NextFunction) {
    try {
      const reminder = await remindersService.getReminderById(req.user!.userId, req.params.id);
      res.status(200).json({
        status: 'success',
        data: reminder,
      });
    } catch (error) {
      next(error);
    }
  }

  async createReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createReminderSchema.parse(req.body);
      const reminder = await remindersService.createReminder(req.user!.userId, validated);
      res.status(201).json({
        status: 'success',
        data: reminder,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateReminderSchema.parse(req.body);
      const reminder = await remindersService.updateReminder(
        req.user!.userId,
        req.params.id,
        validated
      );
      res.status(200).json({
        status: 'success',
        data: reminder,
      });
    } catch (error) {
      next(error);
    }
  }

  async snoozeReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = snoozeReminderSchema.parse(req.body);
      const reminder = await remindersService.snoozeReminder(
        req.user!.userId,
        req.params.id,
        validated.minutes
      );
      res.status(200).json({
        status: 'success',
        data: reminder,
      });
    } catch (error) {
      next(error);
    }
  }

  async completeReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const reminder = await remindersService.completeReminder(
        req.user!.userId,
        req.params.id
      );
      res.status(200).json({
        status: 'success',
        data: reminder,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReminder(req: Request, res: Response, next: NextFunction) {
    try {
      await remindersService.deleteReminder(req.user!.userId, req.params.id);
      res.status(200).json({
        status: 'success',
        message: 'Đã xóa nhắc hẹn thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  async getTags(req: Request, res: Response, next: NextFunction) {
    try {
      const tags = await remindersService.getTags(req.user!.userId);
      res.status(200).json({ status: 'success', data: tags });
    } catch (error) {
      next(error);
    }
  }

  async updateTagColor(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateReminderTagColorSchema.parse(req.body);
      const result = await remindersService.updateTagColor(req.user!.userId, validated);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async renameTag(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = renameReminderTagSchema.parse(req.body);
      const result = await remindersService.renameTag(req.user!.userId, validated);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async deleteTag(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = deleteReminderTagSchema.parse(req.body);
      const result = await remindersService.deleteTag(req.user!.userId, validated);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const remindersController = new RemindersController();
