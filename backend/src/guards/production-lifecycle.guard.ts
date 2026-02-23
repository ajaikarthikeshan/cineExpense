import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ProductionLifecycleGuard implements CanActivate {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const productionId: string | undefined = req.user?.productionId;

    if (!productionId) {
      throw new ForbiddenException('Production context missing');
    }

    let status: string;
    try {
      const rows: { status: string }[] = await this.dataSource.query(
        'SELECT status FROM productions WHERE id = $1',
        [productionId],
      );

      if (!rows.length) {
        throw new ForbiddenException('Production not found');
      }

      status = rows[0].status;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new InternalServerErrorException('Could not verify production status');
    }

    if (status === 'locked') {
      throw new ForbiddenException('Production is locked');
    }

    if (status === 'archived') {
      throw new ForbiddenException('Production is archived');
    }

    return true;
  }
}
