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
  subtasks: z.array(z.string().trim().min(1)).optional().default([]),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskFilterSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  filter: z.enum(['all', 'today', 'overdue', 'urgent', 'done', 'next7days']).optional().default('all'),
  tag: z.string().optional(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val.map((s) => s.trim()).filter(Boolean);
      return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  excludeTags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val.map((s) => s.trim()).filter(Boolean);
      return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  search: z.string().optional(),
  hideCompleted: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === true || val === 'true')),
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

export const createSubtaskSchema = z.object({
  title: z
    .string({ required_error: 'Tiêu đề việc con là bắt buộc' })
    .min(1, 'Tiêu đề việc con không được để trống')
    .max(255, 'Tiêu đề không được vượt quá 255 ký tự')
    .trim(),
});

export const updateSubtaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Tiêu đề việc con không được để trống')
    .max(255, 'Tiêu đề không được vượt quá 255 ký tự')
    .trim()
    .optional(),
  isCompleted: z.boolean().optional(),
});

export const reorderSubtasksSchema = z.object({
  subtaskIds: z
    .array(z.string().uuid('ID việc con không hợp lệ'))
    .min(1, 'Danh sách việc con sắp xếp không được để trống'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
export type RenameTaskTagInput = z.infer<typeof renameTaskTagSchema>;
export type DeleteTaskTagInput = z.infer<typeof deleteTaskTagSchema>;
export type UpdateTaskTagColorInput = z.infer<typeof updateTaskTagColorSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
export type ReorderSubtasksInput = z.infer<typeof reorderSubtasksSchema>;
