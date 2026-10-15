import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Tiêu đề công việc là bắt buộc' })
    .min(1, 'Tiêu đề không được để trống')
    .max(255)
    .trim(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskFilterSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  filter: z.enum(['all', 'today', 'overdue', 'done', 'next7days']).default('all'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
