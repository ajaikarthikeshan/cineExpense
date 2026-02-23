import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { ProductionLifecycleGuard } from '@guards/production-lifecycle.guard';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles('SUPERVISOR')
  @UseGuards(ProductionLifecycleGuard)
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: any) {
    return this.expensesService.create(dto, user.id, user.productionId);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() filters: Record<string, string>) {
    return this.expensesService.findAll(user.productionId, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expensesService.findOneOrFail(id, user.productionId);
  }

  @Post(':id/submit')
  @Roles('SUPERVISOR')
  @UseGuards(ProductionLifecycleGuard)
  submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expensesService.transition(id, user.productionId, 'Submitted', user.id, undefined, user.role);
  }

  @Post(':id/manager/approve')
  @Roles('MANAGER')
  @UseGuards(ProductionLifecycleGuard)
  managerApprove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expensesService.transition(id, user.productionId, 'ManagerApproved', user.id, undefined, user.role);
  }

  @Post(':id/manager/return')
  @Roles('MANAGER')
  @UseGuards(ProductionLifecycleGuard)
  managerReturn(@Param('id') id: string, @Body('comment') comment: string, @CurrentUser() user: any) {
    return this.expensesService.transition(id, user.productionId, 'ManagerReturned', user.id, comment, user.role);
  }

  @Post(':id/manager/reject')
  @Roles('MANAGER')
  @UseGuards(ProductionLifecycleGuard)
  managerReject(@Param('id') id: string, @Body('comment') comment: string, @CurrentUser() user: any) {
    return this.expensesService.transition(id, user.productionId, 'ManagerRejected', user.id, comment, user.role);
  }

  @Post(':id/accounts/approve')
  @Roles('ACCOUNTS')
  @UseGuards(ProductionLifecycleGuard)
  accountsApprove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expensesService.transition(id, user.productionId, 'AccountsApproved', user.id, undefined, user.role);
  }

  @Post(':id/accounts/return')
  @Roles('ACCOUNTS')
  @UseGuards(ProductionLifecycleGuard)
  accountsReturn(@Param('id') id: string, @Body('comment') comment: string, @CurrentUser() user: any) {
    return this.expensesService.transition(id, user.productionId, 'AccountsReturned', user.id, comment, user.role);
  }

}
