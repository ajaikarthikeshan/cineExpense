import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.svc.findForUser(user.id, user.productionId);
  }

  @Post(':id/read')
  markRead(@Param('id') id: string) {
    return this.svc.markRead(id);
  }
}
