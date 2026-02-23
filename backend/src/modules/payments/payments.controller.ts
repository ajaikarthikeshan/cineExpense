import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { MarkPaidDto } from './dto/mark-paid.dto';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':id/accounts/mark-paid')
  @Roles('ACCOUNTS')
  markPaid(
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.markPaid(id, dto, user.id, user.productionId);
  }
}
