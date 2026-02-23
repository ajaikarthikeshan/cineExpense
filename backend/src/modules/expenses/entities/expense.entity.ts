import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn,
} from 'typeorm';

export type ExpenseStatus =
  | 'Draft' | 'Submitted' | 'ManagerReturned' | 'ManagerRejected'
  | 'ManagerApproved' | 'AccountsReturned' | 'AccountsApproved' | 'Paid';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'production_id' })
  productionId: string;

  @Column({ name: 'department_id' })
  departmentId: string;

  @Column({ name: 'submitted_by' })
  submittedBy: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', default: 'Draft' })
  status: ExpenseStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
