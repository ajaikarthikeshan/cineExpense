import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { Expense } from './entities/expense.entity';
import { ExpenseReceipt } from './entities/expense-receipt.entity';
import { ExpenseStatusHistory } from './entities/expense-status-history.entity';
import { BudgetModule } from '@modules/budget/budget.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { AuditModule } from '@modules/audit/audit.module';
import { ProductionLifecycleGuard } from '@guards/production-lifecycle.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, ExpenseReceipt, ExpenseStatusHistory]),
    BudgetModule,
    NotificationsModule,
    AuditModule,
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService, ProductionLifecycleGuard],
  exports: [ExpensesService],
})
export class ExpensesModule {}
