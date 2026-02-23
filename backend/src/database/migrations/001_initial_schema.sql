-- CineExpense Pro – Initial Schema Migration
-- Run via: psql -d cineexpense -f 001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Productions (one per SaaS account)
CREATE TABLE productions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active','locked','archived')),
  base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  budget_alert_threshold NUMERIC(4,3) NOT NULL DEFAULT 0.80,
  producer_override_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(20) UNIQUE NOT NULL
);
INSERT INTO roles (name) VALUES ('ADMIN'),('SUPERVISOR'),('MANAGER'),('ACCOUNTS'),('PRODUCER');

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_id UUID NOT NULL REFERENCES productions(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  role VARCHAR(20) NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_id UUID NOT NULL REFERENCES productions(id),
  name TEXT NOT NULL,
  allocated_budget NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User ↔ Department access mapping
CREATE TABLE user_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  UNIQUE(user_id, department_id)
);

-- Expenses (core table)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_id UUID NOT NULL REFERENCES productions(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  submitted_by UUID NOT NULL REFERENCES users(id),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Business rule: currency must match production base currency (enforced in app layer)
  CONSTRAINT no_future_dates CHECK (expense_date <= CURRENT_DATE)
);

-- Receipts (mandatory before submit)
CREATE TABLE expense_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id),
  file_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable status history
CREATE TABLE expense_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id),
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  comment TEXT,
  performed_by UUID NOT NULL REFERENCES users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Producer budget overrides
CREATE TABLE expense_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id),
  override_type VARCHAR(20) NOT NULL DEFAULT 'budget',
  reason TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments (one per expense)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID UNIQUE NOT NULL REFERENCES expenses(id),
  payment_method VARCHAR(10) NOT NULL CHECK (payment_method IN ('cash','bank')),
  reference_number TEXT NOT NULL,
  payment_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_id UUID NOT NULL REFERENCES productions(id),
  entity_type VARCHAR(30) NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  performed_by UUID NOT NULL REFERENCES users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- In-app notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_id UUID NOT NULL REFERENCES productions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_expenses_production_status ON expenses(production_id, status, created_at);
CREATE INDEX idx_expenses_production_dept ON expenses(production_id, department_id, status);
CREATE INDEX idx_expenses_submitted_by ON expenses(production_id, submitted_by, created_at);
CREATE INDEX idx_status_history_expense ON expense_status_history(expense_id, performed_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_audit_logs_production ON audit_logs(production_id, performed_at);
