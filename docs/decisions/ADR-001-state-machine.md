# ADR-001: Expense Workflow as a Strict Server-Side State Machine

## Status
Accepted

## Context
Expenses move through a defined lifecycle. Client-driven state changes are a security risk.

## Decision
All state transitions are validated and executed server-side only.
Allowed transitions are defined in a constant map in `ExpensesService`.
Any invalid transition returns HTTP 409 Conflict.

## Consequences
- Frontend cannot fake approval actions
- New transitions require a code change (intentional – prevents ad-hoc workflow drift)
