import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'production_id' }) productionId: string;
  @Column({ name: 'role_id' }) roleId: string;
  @Column() role: string; // denormalized for JWT claims
  @Column() name: string;
  @Column({ unique: true }) email: string;
  @Column({ name: 'password_hash' }) passwordHash: string;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
