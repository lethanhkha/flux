import { z } from 'zod';

export const createWalletSchema = z.object({
  name: z.string({ required_error: 'Tên ví là bắt buộc' }).min(1).max(100).trim(),
  currency: z.string().default('VND'),
  initialBalance: z.number().default(0),
  icon: z.string().default('wallet'),
  color: z.string().default('#6366F1'),
});

export const updateWalletSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const createTransactionSchema = z
  .object({
    walletId: z.string().uuid('ID ví không hợp lệ'),
    destinationWalletId: z.string().uuid('ID ví đích không hợp lệ').optional().nullable(),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], {
      required_error: 'Loại giao dịch là bắt buộc',
    }),
    amount: z
      .number({ required_error: 'Số tiền là bắt buộc' })
      .positive('Số tiền phải lớn hơn 0'),
    category: z.string({ required_error: 'Danh mục là bắt buộc' }).min(1).max(100).trim(),
    transactionDate: z.string().optional(),
    note: z.string().max(500).optional().nullable(),
    receiptUrl: z.string().url().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.type === 'TRANSFER') {
        return !!data.destinationWalletId && data.destinationWalletId !== data.walletId;
      }
      return true;
    },
    {
      message: 'Giao dịch chuyển khoản yêu cầu ví đích hợp lệ và khác ví nguồn',
      path: ['destinationWalletId'],
    }
  );

export const transferMoneySchema = z.object({
  sourceWalletId: z.string().uuid('ID ví nguồn không hợp lệ'),
  destinationWalletId: z.string().uuid('ID ví đích không hợp lệ'),
  amount: z.number().positive('Số tiền chuyển phải lớn hơn 0'),
  note: z.string().max(500).optional().default('Chuyển tiền nội bộ giữa các ví'),
});

export const createCategorySchema = z.object({
  name: z.string({ required_error: 'Tên danh mục là bắt buộc' }).min(1, 'Tên không được để trống').max(100).trim(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).default('EXPENSE'),
  icon: z.string().optional().default('Tag'),
  color: z.string().optional().default('#6366F1'),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Tên không được để trống').max(100).trim().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const updateTransactionSchema = z.object({
  walletId: z.string().uuid('ID ví không hợp lệ').optional(),
  destinationWalletId: z.string().uuid('ID ví đích không hợp lệ').optional().nullable(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  amount: z.number().positive('Số tiền phải lớn hơn 0').optional(),
  category: z.string().min(1).max(100).trim().optional(),
  transactionDate: z.string().optional(),
  note: z.string().max(500).optional().nullable(),
  receiptUrl: z.string().url().optional().nullable(),
});

export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransferMoneyInput = z.infer<typeof transferMoneySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
