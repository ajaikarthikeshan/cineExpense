/**
 * PROTOTYPE: JWT validation is bypassed.
 * Every request is treated as the hardcoded ADMIN user.
 * Re-enable real validation before production.
 */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HARDCODED_USER } from '@modules/auth/auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = HARDCODED_USER; // Hardcoded for prototype
    return true;
  }
}
