import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'production_id' }) productionId: string;
  @Column({ name: 'entity_type' }) entityType: string;
  @Column({ name: 'entity_id' }) entityId: string;
  @Column() action: string;
  @Column({ type: 'jsonb', nullable: true }) metadata: Record<string, unknown>;
  @Column({ name: 'performed_by' }) performedBy: string;
  @CreateDateColumn({ name: 'performed_at' }) performedAt: Date;
}
