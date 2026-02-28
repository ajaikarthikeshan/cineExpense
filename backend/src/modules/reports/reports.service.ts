import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Department } from '@modules/departments/entities/department.entity';
import { Expense } from '@modules/expenses/entities/expense.entity';
import { Production } from '@modules/admin/entities/production.entity';
import { computeUtilization, isThresholdBreached } from '@shared/utils/budget.util';

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async getBudgetVsActual(productionId: string) {
    const production = await this.dataSource.getRepository(Production).findOne({
      where: { id: productionId },
    });
    if (!production) throw new NotFoundException('Production not found');

    const departments = await this.dataSource.getRepository(Department).find({
      where: { productionId },
    });

    const deptSummaries = await Promise.all(
      departments.map(async (dept) => {
        const { sum } = await this.dataSource
          .getRepository(Expense)
          .createQueryBuilder('e')
          .select('COALESCE(SUM(e.amount), 0)', 'sum')
          .where('e.department_id = :departmentId', { departmentId: dept.id })
          .andWhere('e.production_id = :productionId', { productionId })
          .andWhere('e.status IN (:...statuses)', {
            statuses: ['AccountsApproved', 'Paid'],
          })
          .getRawOne();

        const approvedSum = parseFloat(sum ?? '0');
        const utilization = computeUtilization(approvedSum, dept.allocatedBudget);

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          allocatedBudget: Number(dept.allocatedBudget),
          approvedSum,
          utilizationPercent: utilization,
          isOverThreshold: isThresholdBreached(utilization),
        };
      }),
    );

    return {
      production: {
        id: production.id,
        name: production.name,
        status: production.status,
        baseCurrency: production.baseCurrency,
        budgetAlertThreshold: Number(production.budgetAlertThreshold),
      },
      departments: deptSummaries,
    };
  }
}
