import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type PaymentMethod = 'cash' | 'bank';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'expense_id', unique: true })
  expenseId: string;

  @Column({ name: 'payment_method', type: 'varchar' })
  paymentMethod: PaymentMethod;

  @Column({ name: 'reference_number', type: 'text' })
  referenceNumber: string;

  @Column({ name: 'payment_date', type: 'date' })
  paymentDate: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
