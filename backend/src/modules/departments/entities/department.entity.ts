import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'production_id' }) productionId: string;
  @Column() name: string;
  @Column({ name: 'allocated_budget', type: 'numeric', precision: 14, scale: 2 }) allocatedBudget: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
