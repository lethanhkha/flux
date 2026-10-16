import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z
    .string({ required_error: 'Tiêu đề ghi chú là bắt buộc' })
    .min(1, 'Tiêu đề không được để trống')
    .max(255)
    .trim(),
  content: z.string({ required_error: 'Nội dung ghi chú là bắt buộc' }),
  color: z.string().default('#FFFFFF'),
  tags: z.array(z.string().trim().toLowerCase()).default([]),
  isPinned: z.boolean().default(false),
});

export const updateNoteSchema = createNoteSchema.partial();

export const searchNoteSchema = z.object({
  q: z.string().optional(),
  tag: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export const renameTagSchema = z.object({
  oldTag: z.string().trim().min(1, 'Tên thẻ cũ không được để trống').toLowerCase(),
  newTag: z.string().trim().min(1, 'Tên thẻ mới không được để trống').toLowerCase(),
});

export const deleteTagSchema = z.object({
  tag: z.string().trim().min(1, 'Tên thẻ cần xóa không được để trống').toLowerCase(),
});

export const updateNoteTagColorSchema = z.object({
  tag: z.string().trim().min(1, 'Tên thẻ không được để trống').toLowerCase(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Mã màu không hợp lệ'),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type SearchNoteInput = z.infer<typeof searchNoteSchema>;
export type RenameTagInput = z.infer<typeof renameTagSchema>;
export type DeleteTagInput = z.infer<typeof deleteTagSchema>;
export type UpdateNoteTagColorInput = z.infer<typeof updateNoteTagColorSchema>;
