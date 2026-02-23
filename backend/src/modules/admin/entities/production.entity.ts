import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type ProductionStatus = 'active' | 'locked' | 'archived';

@Entity('productions')
export class Production {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'varchar', length: 10, default: 'active' })
  status: ProductionStatus;

  @Column({ name: 'base_currency', type: 'varchar', length: 3 })
  baseCurrency: string;

  @Column({
    name: 'budget_alert_threshold',
    type: 'numeric',
    precision: 4,
    scale: 3,
    default: 0.80,
  })
  budgetAlertThreshold: number;

  @Column({ name: 'producer_override_enabled', default: false })
  producerOverrideEnabled: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
