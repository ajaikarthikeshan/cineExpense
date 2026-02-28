import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('budget-vs-actual')
  getBudgetVsActual(@CurrentUser() user: any) {
    return this.reportsService.getBudgetVsActual(user.productionId);
  }
}
