import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Expense } from '@modules/expenses/entities/expense.entity';
import { ExpenseStatusHistory } from '@modules/expenses/entities/expense-status-history.entity';
import { AuditService } from '@modules/audit/audit.service';
import { Payment } from './entities/payment.entity';
import { MarkPaidDto } from './dto/mark-paid.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async markPaid(
    expenseId: string,
    dto: MarkPaidDto,
    userId: string,
    productionId: string,
  ): Promise<Payment> {
    return this.dataSource.transaction(async (em) => {
      const expense = await em.findOne(Expense, {
        where: { id: expenseId, productionId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!expense) throw new NotFoundException('Expense not found');

      if (expense.status !== 'AccountsApproved') {
        throw new ConflictException(
          `Expense must be in AccountsApproved state to mark as paid, current state: ${expense.status}`,
        );
      }

      const payment = await em.save(Payment, {
        expenseId,
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
        paymentDate: dto.paymentDate,
        createdBy: userId,
      });

      expense.status = 'Paid';
      await em.save(Expense, expense);

      await em.save(ExpenseStatusHistory, {
        expenseId,
        fromStatus: 'AccountsApproved',
        toStatus: 'Paid',
        performedBy: userId,
      });

      await this.auditService.log({
        productionId,
        entityType: 'expense',
        entityId: expenseId,
        action: 'status:AccountsApproved->Paid',
        performedBy: userId,
      });

      return payment;
    });
  }
}
