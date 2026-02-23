# ADR-002: Pessimistic Locking for Budget Enforcement

## Status
Accepted

## Context
Concurrent manager approvals could both pass the budget check individually but together overspend.

## Decision
Manager approval runs inside a PostgreSQL transaction with `SELECT ... FOR UPDATE` on the department row.
Budget recalculation happens within the same transaction.

## Consequences
- Slight throughput reduction on high-concurrency approval flows
- Budget integrity guaranteed – no over-approval race possible
