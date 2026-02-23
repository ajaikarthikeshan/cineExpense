import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Production } from './entities/production.entity';
import { ProductionService } from './production.service';
import { AdminController } from './admin.controller';
import { AuditModule } from '@modules/audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Production]), AuditModule],
  controllers: [AdminController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class AdminModule {}
