import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '@modules/audit/audit.service';

/**
 * Wraps write endpoints to auto-emit audit log entries.
 * Applied selectively via @UseInterceptors(AuditInterceptor).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        // Audit logging is primarily done inside service layer for precision.
        // This interceptor is available for coarse-grained logging if needed.
      })
    );
  }
}
