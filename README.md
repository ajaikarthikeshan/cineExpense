# CineExpense Pro

Web-based SaaS for structured financial governance in film productions.

## Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand
- **Backend**: Node.js / NestJS, TypeScript
- **Database**: PostgreSQL (managed)
- **Storage**: S3-compatible (receipts)
- **Auth**: JWT (access + refresh tokens)

## Structure
- `frontend/` – Next.js web client
- `backend/` – NestJS REST API
- `infra/` – Docker, Nginx, deployment scripts
- `docs/` – Architecture decisions, API reference

## Quick Start
See `infra/docker/docker-compose.yml` to spin up the full stack locally.
