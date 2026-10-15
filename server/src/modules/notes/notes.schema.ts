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
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type SearchNoteInput = z.infer<typeof searchNoteSchema>;
