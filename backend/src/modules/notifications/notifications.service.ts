import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private repo: Repository<Notification>) {}

  async create(data: {
    productionId: string;
    userId: string;
    type: string;
    payload: Record<string, unknown>;
  }) {
    return this.repo.save(this.repo.create(data));
  }

  async findForUser(userId: string, productionId: string) {
    return this.repo.find({ where: { userId, productionId }, order: { createdAt: 'DESC' } });
  }

  async markRead(id: string) {
    return this.repo.update(id, { isRead: true });
  }
}
