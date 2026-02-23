import { z } from 'zod';

export const createExpenseSchema = z.object({
  departmentId: z.string().min(1, 'Department is required'),
  amount: z.number().positive('Amount must be positive'),
  expenseDate: z
    .string()
    .refine((d) => new Date(d) <= new Date(), 'Future dates are not allowed'),
  description: z.string().min(3, 'Description is required'),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const rejectReturnSchema = z.object({
  comment: z.string().min(5, 'Comment is required for this action'),
});

export const markPaidSchema = z.object({
  paymentMethod: z.enum(['cash', 'bank']),
  referenceNumber: z.string().min(1, 'Reference number is required'),
  paymentDate: z.string(),
});
