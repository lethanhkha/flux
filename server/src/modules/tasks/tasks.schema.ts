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
  dueDate: z
    .union([z.string().datetime(), z.literal(''), z.null()])
    .optional()
    .transform((val) => (val === '' ? null : val)),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z
    .union([z.enum(['DAILY', 'WEEKLY', 'MONTHLY']), z.literal(''), z.null()])
    .optional()
    .transform((val) => (val === '' ? null : val)),
  tags: z.array(z.string().trim()).default([]),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskFilterSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  filter: z.enum(['all', 'today', 'overdue', 'urgent', 'done', 'next7days']).optional().default('all'),
  tag: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export const renameTaskTagSchema = z.object({
  oldTag: z.string().min(1, 'Thẻ cũ không được để trống').trim(),
  newTag: z.string().min(1, 'Thẻ mới không được để trống').trim(),
});

export const deleteTaskTagSchema = z.object({
  tag: z.string().min(1, 'Thẻ cần xóa không được để trống').trim(),
});

export const updateTaskTagColorSchema = z.object({
  tag: z.string().min(1, 'Tên thẻ không được để trống').trim(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Mã màu không hợp lệ'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
export type RenameTaskTagInput = z.infer<typeof renameTaskTagSchema>;
export type DeleteTaskTagInput = z.infer<typeof deleteTaskTagSchema>;
export type UpdateTaskTagColorInput = z.infer<typeof updateTaskTagColorSchema>;
