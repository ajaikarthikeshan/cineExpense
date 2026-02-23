import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { BudgetModule } from './modules/budget/budget.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    AuthModule,
    UsersModule,
    DepartmentsModule,
    ExpensesModule,
    ApprovalsModule,
    BudgetModule,
    PaymentsModule,
    ReportsModule,
    NotificationsModule,
    AuditModule,
    AdminModule,
  ],
})
export class AppModule {}
