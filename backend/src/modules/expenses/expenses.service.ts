import {
  Injectable, NotFoundException, BadRequestException,
  ConflictException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Expense, ExpenseStatus } from './entities/expense.entity';
import { ExpenseStatusHistory } from './entities/expense-status-history.entity';
import { BudgetService } from '@modules/budget/budget.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { AuditService } from '@modules/audit/audit.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

// Valid transitions per the state machine
const ALLOWED_TRANSITIONS: Record<ExpenseStatus, ExpenseStatus[]> = {
  Draft: ['Submitted'],
  Submitted: ['ManagerApproved', 'ManagerRejected', 'ManagerReturned'],
  ManagerReturned: ['Submitted'],
  ManagerRejected: ['Submitted'],
  ManagerApproved: ['AccountsApproved', 'AccountsReturned'],
  AccountsReturned: ['Submitted'],
  AccountsApproved: ['Paid'],
  Paid: [],
};

const EDITABLE_STATES: ExpenseStatus[] = ['Draft', 'ManagerReturned', 'ManagerRejected', 'AccountsReturned'];

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    @InjectRepository(ExpenseStatusHistory) private historyRepo: Repository<ExpenseStatusHistory>,
    private readonly budgetService: BudgetService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateExpenseDto, userId: string, productionId: string) {
    const expense = this.expenseRepo.create({ ...dto, submittedBy: userId, productionId, status: 'Draft' });
    return this.expenseRepo.save(expense);
  }

  async findAll(productionId: string, filters?: Record<string, string>) {
    return this.expenseRepo.find({ where: { productionId, ...filters } });
  }

  async findOneOrFail(id: string, productionId: string) {
    const expense = await this.expenseRepo.findOne({ where: { id, productionId } });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async transition(
    id: string,
    productionId: string,
    toStatus: ExpenseStatus,
    performedBy: string,
    comment?: string,
  ) {
    return this.dataSource.transaction(async (em) => {
      const expense = await em.findOne(Expense, {
        where: { id, productionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!expense) throw new NotFoundException();

      const allowed = ALLOWED_TRANSITIONS[expense.status];
      if (!allowed.includes(toStatus)) {
        throw new ConflictException(`Cannot transition from ${expense.status} to ${toStatus}`);
      }

      // Budget check at ManagerApprove
      if (toStatus === 'ManagerApproved') {
        const overBudget = await this.budgetService.wouldExceedBudget(
          expense.departmentId, productionId, expense.amount, expense.id, em
        );
        if (overBudget) throw new ConflictException('Over budget. Producer override required.');
      }

      const prev = expense.status;
      expense.status = toStatus;
      await em.save(expense);

      await em.save(ExpenseStatusHistory, {
        expenseId: id, fromStatus: prev, toStatus, comment, performedBy,
      });

      await this.auditService.log({ productionId, entityType: 'expense', entityId: id, action: `status:${prev}->${toStatus}`, performedBy });

      return expense;
    });
  }

  isEditable(expense: Expense): boolean {
    return EDITABLE_STATES.includes(expense.status);
  }
}
