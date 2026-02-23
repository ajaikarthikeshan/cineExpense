# CineExpense Pro – Architecture Overview

## Deployment Topology
```
Browser (Next.js SSR/CSR)
        │
        ▼ HTTPS
  NestJS REST API  ──── PostgreSQL (managed)
        │
        └──────────────  S3-compatible Storage (receipts)
```

## Key Design Decisions

### Tenancy
Every business table carries `production_id` as a foreign key.
A middleware layer attaches `productionId` from the JWT to every request.
No query runs without this scope.

### Auth
JWT access token (15m) + refresh token (7d).
Role and production_id are embedded in JWT claims for fast RBAC.

### Workflow
Server-side state machine with explicit allowed-transitions map.
Invalid transitions return 409. All transitions are immutable-logged.

### Budget
Consumption point is `AccountsApproved` (not Manager approval).
Manager approval is *blocked* if the expense would exceed budget.
The block can only be lifted by a Producer override (single-expense scope, logged).

### Audit
Append-only `audit_logs` and `expense_status_history` tables.
No DELETE or UPDATE permitted on these tables.

## Module Dependency Graph
```
AppModule
├── AuthModule → UsersModule
├── ExpensesModule → BudgetModule, NotificationsModule, AuditModule
├── ApprovalsModule (thin controller wrappers around ExpensesService transitions)
├── PaymentsModule → AuditModule
├── ReportsModule → (read-only queries)
├── AdminModule → UsersModule, DepartmentsModule
└── NotificationsModule (standalone)
```
