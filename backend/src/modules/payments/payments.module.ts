import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { AuditModule } from '@modules/audit/audit.module';
import { ProductionLifecycleGuard } from '@guards/production-lifecycle.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), AuditModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, ProductionLifecycleGuard],
  exports: [PaymentsService],
})
export class PaymentsModule {}
