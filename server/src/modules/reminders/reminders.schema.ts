import { z } from 'zod';

export const createReminderSchema = z.object({
  title: z
    .string({ required_error: 'Tiêu đề nhắc hẹn là bắt buộc' })
    .min(1, 'Tiêu đề không được để trống')
    .max(255, 'Tiêu đề không được vượt quá 255 ký tự')
    .trim(),
  description: z.string().max(2000, 'Mô tả không được vượt quá 2000 ký tự').optional().nullable(),
  scheduledAt: z
    .string({ required_error: 'Thời gian nhắc hẹn là bắt buộc' })
    .datetime({ message: 'Thời gian nhắc hẹn không đúng định dạng ISO 8601' }),
  remindBefore: z
    .coerce
    .number()
    .int()
    .min(0, 'Thời gian báo trước không hợp lệ')
    .max(525600, 'Thời gian báo trước tối đa là 365 ngày')
    .default(0),
  location: z.string().max(255, 'Địa điểm không được vượt quá 255 ký tự').optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z
    .union([z.enum(['DAILY', 'WEEKLY', 'MONTHLY']), z.literal(''), z.null()])
    .optional()
    .transform((val) => (val === '' ? null : val)),
  tags: z.array(z.string().trim()).default([]),
});

export const updateReminderSchema = createReminderSchema.partial().extend({
  status: z.enum(['SCHEDULED', 'SNOOZED', 'COMPLETED', 'MISSED']).optional(),
});

export const snoozeReminderSchema = z.object({
  minutes: z
    .coerce
    .number()
    .int()
    .min(1, 'Thời gian hoãn tối thiểu là 1 phút')
    .max(1440, 'Thời gian hoãn tối đa là 1 ngày')
    .default(10),
});

export const reminderFilterSchema = z.object({
  filter: z.enum(['all', 'today', 'upcoming', 'past']).optional().default('all'),
  status: z.enum(['SCHEDULED', 'SNOOZED', 'COMPLETED', 'MISSED']).optional(),
  search: z.string().optional(),
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
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const renameReminderTagSchema = z.object({
  oldTag: z.string().min(1, 'Thẻ cũ không được để trống').trim(),
  newTag: z.string().min(1, 'Thẻ mới không được để trống').trim(),
});

export const deleteReminderTagSchema = z.object({
  tag: z.string().min(1, 'Thẻ cần xóa không được để trống').trim(),
});

export const updateReminderTagColorSchema = z.object({
  tag: z.string().min(1, 'Tên thẻ không được để trống').trim(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Mã màu không hợp lệ'),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
export type SnoozeReminderInput = z.infer<typeof snoozeReminderSchema>;
export type ReminderFilterInput = z.infer<typeof reminderFilterSchema>;
export type RenameReminderTagInput = z.infer<typeof renameReminderTagSchema>;
export type DeleteReminderTagInput = z.infer<typeof deleteReminderTagSchema>;
export type UpdateReminderTagColorInput = z.infer<typeof updateReminderTagColorSchema>;
