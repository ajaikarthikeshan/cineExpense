import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Production, ProductionStatus } from './entities/production.entity';
import { AuditService } from '@modules/audit/audit.service';

const VALID_TRANSITIONS: Record<ProductionStatus, ProductionStatus[]> = {
  active: ['locked', 'archived'],
  locked: ['active', 'archived'],
  archived: [],
};

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(Production) private repo: Repository<Production>,
    private auditService: AuditService,
  ) {}

  async findById(id: string): Promise<Production> {
    const production = await this.repo.findOne({ where: { id } });
    if (!production) throw new NotFoundException('Production not found');
    return production;
  }

  async getStatus(id: string): Promise<ProductionStatus> {
    const production = await this.findById(id);
    return production.status;
  }

  async setStatus(id: string, newStatus: ProductionStatus, performedBy: string): Promise<Production> {
    const production = await this.findById(id);
    const currentStatus = production.status;

    if (currentStatus === 'archived') {
      throw new ConflictException('Archived productions cannot transition to any other status');
    }

    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed.includes(newStatus)) {
      throw new ConflictException(
        `Cannot transition from '${currentStatus}' to '${newStatus}'`,
      );
    }

    production.status = newStatus;
    const updated = await this.repo.save(production);

    await this.auditService.log({
      productionId: id,
      entityType: 'production',
      entityId: id,
      action: `status_changed:${currentStatus}->${newStatus}`,
      performedBy,
      metadata: { from: currentStatus, to: newStatus },
    });

    return updated;
  }
}
