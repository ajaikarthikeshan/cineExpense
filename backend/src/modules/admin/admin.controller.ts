import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { ProductionService } from './production.service';
import { ProductionStatus } from './entities/production.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('production')
  @Roles('ADMIN')
  getProduction(@CurrentUser() user: any) {
    return this.productionService.findById(user.productionId);
  }

  @Patch('production/status')
  @Roles('ADMIN')
  setStatus(
    @Body('status') status: ProductionStatus,
    @CurrentUser() user: any,
  ) {
    return this.productionService.setStatus(user.productionId, status, user.id);
  }
}
