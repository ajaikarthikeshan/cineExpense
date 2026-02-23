import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('expense_receipts')
export class ExpenseReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'expense_id' })
  expenseId: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
