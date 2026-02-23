import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Expense } from '@modules/expenses/entities/expense.entity';
import { Department } from '@modules/departments/entities/department.entity';
import { isOverBudget, computeUtilization, isThresholdBreached } from '@shared/utils/budget.util';

@Injectable()
export class BudgetService {
  /**
   * Check if approving this expense would exceed the department budget.
   * Runs inside the caller's transaction for race safety.
   */
  async wouldExceedBudget(
    departmentId: string,
    productionId: string,
    amount: number,
    currentExpenseId: string,
    em: EntityManager,
  ): Promise<boolean> {
    const dept = await em.findOneOrFail(Department, { where: { id: departmentId } });

    const { sum } = await em
      .createQueryBuilder(Expense, 'e')
      .select('SUM(e.amount)', 'sum')
      .where('e.department_id = :departmentId', { departmentId })
      .andWhere('e.production_id = :productionId', { productionId })
      .andWhere('e.status IN (:...statuses)', { statuses: ['AccountsApproved', 'Paid'] })
      .andWhere('e.id != :currentExpenseId', { currentExpenseId })
      .getRawOne();

    const approvedSum = parseFloat(sum ?? '0');
    return isOverBudget(approvedSum + amount, dept.allocatedBudget);
  }

  async getUtilization(departmentId: string, productionId: string, em: EntityManager) {
    const dept = await em.findOneOrFail(Department, { where: { id: departmentId } });
    const { sum } = await em
      .createQueryBuilder(Expense, 'e')
      .select('SUM(e.amount)', 'sum')
      .where('e.department_id = :departmentId', { departmentId })
      .andWhere('e.production_id = :productionId', { productionId })
      .andWhere('e.status IN (:...statuses)', { statuses: ['AccountsApproved', 'Paid'] })
      .getRawOne();

    const approvedSum = parseFloat(sum ?? '0');
    const utilization = computeUtilization(approvedSum, dept.allocatedBudget);
    return { utilization, isThreshold: isThresholdBreached(utilization) };
  }
}
