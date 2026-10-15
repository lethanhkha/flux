import { Request, Response, NextFunction } from 'express';
import { tasksService } from './tasks.service';
import { createTaskSchema, updateTaskSchema, taskFilterSchema } from './tasks.schema';

export class TasksController {
  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = taskFilterSchema.parse(req.query);
      const tasks = await tasksService.getTasks(req.user!.userId, filter);
      res.status(200).json({ status: 'success', data: tasks });
    } catch (error) {
      next(error);
    }
  }

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createTaskSchema.parse(req.body);
      const task = await tasksService.createTask(req.user!.userId, validated);
      res.status(201).json({ status: 'success', data: task });
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateTaskSchema.parse(req.body);
      const task = await tasksService.updateTask(
        req.user!.userId,
        req.params.id,
        validated
      );
      res.status(200).json({ status: 'success', data: task });
    } catch (error) {
      next(error);
    }
  }

  async toggleTaskComplete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.toggleTaskComplete(req.user!.userId, req.params.id);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.deleteTask(req.user!.userId, req.params.id);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getTopPriorityTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await tasksService.getTopPriorityTasks(req.user!.userId);
      res.status(200).json({ status: 'success', data: tasks });
    } catch (error) {
      next(error);
    }
  }
}

export const tasksController = new TasksController();
