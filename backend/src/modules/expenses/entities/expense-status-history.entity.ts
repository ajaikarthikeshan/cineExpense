import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('expense_status_history')
export class ExpenseStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'expense_id' })
  expenseId: string;

  @Column({ name: 'from_status', nullable: true })
  fromStatus: string;

  @Column({ name: 'to_status' })
  toStatus: string;

  @Column({ nullable: true })
  comment: string;

  @Column({ name: 'performed_by' })
  performedBy: string;

  @CreateDateColumn({ name: 'performed_at' })
  performedAt: Date;
}
