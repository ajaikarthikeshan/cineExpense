import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class ProductionLifecycleGuard implements CanActivate {

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    // PROTOTYPE: production lifecycle check bypassed.
    // Re-enable DB lookup before production.
    return true;
  }
}
