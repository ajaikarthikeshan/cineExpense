import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

interface LogEntry {
  productionId: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private repo: Repository<AuditLog>) {}

  async log(entry: LogEntry) {
    return this.repo.save(this.repo.create(entry));
  }
}
