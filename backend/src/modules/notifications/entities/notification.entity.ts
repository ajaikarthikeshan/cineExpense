import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'production_id' }) productionId: string;
  @Column({ name: 'user_id' }) userId: string;
  @Column() type: string;
  @Column({ type: 'jsonb' }) payload: Record<string, unknown>;
  @Column({ name: 'is_read', default: false }) isRead: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
