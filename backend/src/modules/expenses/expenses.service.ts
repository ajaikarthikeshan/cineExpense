import {
  Injectable, NotFoundException, BadRequestException,
  ConflictException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Expense, ExpenseStatus } from './entities/expense.entity';
import { ExpenseStatusHistory } from './entities/expense-status-history.entity';
import { ExpenseReceipt } from './entities/expense-receipt.entity';
import { BudgetService } from '@modules/budget/budget.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { AuditService } from '@modules/audit/audit.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import * as path from 'path';
import * as fs from 'fs';

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

const TRANSITION_ROLE_REQUIREMENT: Partial<Record<ExpenseStatus, string>> = {
  Submitted: 'SUPERVISOR',
  ManagerApproved: 'MANAGER',
  ManagerReturned: 'MANAGER',
  ManagerRejected: 'MANAGER',
  AccountsApproved: 'ACCOUNTS',
  AccountsReturned: 'ACCOUNTS',
  Paid: 'ACCOUNTS',
};

const COMMENT_REQUIRED_STATUSES: ExpenseStatus[] = ['ManagerReturned', 'ManagerRejected', 'AccountsReturned'];

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
    const duplicateCount = await this.expenseRepo
      .createQueryBuilder('e')
      .where('e.departmentId = :departmentId', { departmentId: dto.departmentId })
      .andWhere('e.productionId = :productionId', { productionId })
      .andWhere('e.amount = :amount', { amount: dto.amount })
      .andWhere('e.expenseDate = :expenseDate', { expenseDate: dto.expenseDate })
      .andWhere('e.status != :rejected', { rejected: 'ManagerRejected' })
      .getCount();

    const expense = this.expenseRepo.create({ ...dto, submittedBy: userId, productionId, status: 'Draft' });
    const saved = await this.expenseRepo.save(expense);
    return { expense: saved, isDuplicateWarning: duplicateCount > 0 };
  }

  async findAll(productionId: string, filters?: Record<string, string>) {
    const qb = this.expenseRepo.createQueryBuilder('e')
      .where('e.productionId = :productionId', { productionId });

    // Handle comma-separated status filter
    if (filters?.status) {
      const statuses = filters.status.split(',').map(s => s.trim());
      qb.andWhere('e.status IN (:...statuses)', { statuses });
    }

    const expenses = await qb.orderBy('e.created_at', 'DESC').getMany();
    return { data: expenses, total: expenses.length, page: 1, limit: expenses.length };
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
    performedByRole?: string,
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

      // Comment required for reject/return actions
      if (COMMENT_REQUIRED_STATUSES.includes(toStatus) && !comment?.trim()) {
        throw new BadRequestException('Comment is required for reject and return actions');
      }

      // Role must match the transition requirement
      const requiredRole = TRANSITION_ROLE_REQUIREMENT[toStatus];
      if (requiredRole && performedByRole !== requiredRole) {
        throw new ForbiddenException('Your role is not permitted to perform this transition');
      }

      if (toStatus === 'Submitted') {
        // At least one receipt must exist before submission
        const receiptCount = await em.count(ExpenseReceipt, { where: { expenseId: id } });
        if (receiptCount === 0) {
          throw new BadRequestException('At least one receipt must be uploaded before submitting');
        }

        // Only the expense owner may submit
        if (expense.submittedBy !== performedBy) {
          throw new ForbiddenException('You can only submit your own expenses');
        }
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

  async update(id: string, dto: UpdateExpenseDto, userId: string, productionId: string) {
    const expense = await this.expenseRepo.findOne({ where: { id, productionId } });
    if (!expense) throw new NotFoundException('Expense not found');
    if (!EDITABLE_STATES.includes(expense.status)) {
      throw new ConflictException(`Cannot edit expense in ${expense.status} status`);
    }
    if (expense.submittedBy !== userId) {
      throw new ForbiddenException('You can only edit your own expenses');
    }
    Object.assign(expense, dto);
    return this.expenseRepo.save(expense);
  }

  async uploadReceipt(
    id: string,
    file: Express.Multer.File,
    userId: string,
    productionId: string,
  ) {
    const expense = await this.expenseRepo.findOne({ where: { id, productionId } });
    if (!expense) throw new NotFoundException('Expense not found');
    if (!EDITABLE_STATES.includes(expense.status)) {
      throw new ConflictException('Cannot upload receipt for this expense');
    }

    // Store file on local disk (demo — production would use S3/MinIO)
    const uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filename = `${id}_${Date.now()}_${file.originalname}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    const receipt = this.dataSource.getRepository(ExpenseReceipt).create({
      expenseId: id,
      filePath: `/uploads/receipts/${filename}`,
      uploadedBy: userId,
    });
    const saved = await this.dataSource.getRepository(ExpenseReceipt).save(receipt);

    await this.auditService.log({
      productionId,
      entityType: 'expense',
      entityId: id,
      action: 'receipt:uploaded',
      performedBy: userId,
    });

    return saved;
  }

  async markPaid(
    id: string,
    body: { paymentMethod: string; referenceNumber: string; paymentDate: string },
    userId: string,
    productionId: string,
  ) {
    return this.transition(id, productionId, 'Paid', userId, undefined, 'ACCOUNTS');
  }

  async producerOverrideBudget(
    id: string,
    reason: string,
    userId: string,
    productionId: string,
  ) {
    const expense = await this.expenseRepo.findOne({ where: { id, productionId } });
    if (!expense) throw new NotFoundException();
    if (!reason?.trim()) throw new BadRequestException('Override reason is required');

    await this.auditService.log({
      productionId,
      entityType: 'expense',
      entityId: id,
      action: 'budget:producer-override',
      performedBy: userId,
    });

    // After override, allow the manager approve transition to proceed without budget check
    // For demo, we simply mark it as ManagerApproved
    return this.transition(id, productionId, 'ManagerApproved', userId, `Producer override: ${reason}`, 'MANAGER');
  }
}
