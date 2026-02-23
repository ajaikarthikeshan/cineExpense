import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Ensures every authenticated request carries the correct production_id scope.
 * The production_id is extracted from the JWT claims and attached to req.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request & { user?: any; productionId?: string }, _res: Response, next: NextFunction) {
    if (req.user?.productionId) {
      req.productionId = req.user.productionId;
    }
    next();
  }
}
