-- =============================================================================
-- Kohort EMS - PostgreSQL Database Schema
-- Complete, production-grade schema matching all JPA Entities exactly.
-- =============================================================================

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Employees Table (Includes 13-day TTL Archive attributes)
CREATE TABLE IF NOT EXISTS employees (
    id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(25) NOT NULL,
    department_id BIGINT NOT NULL,
    designation VARCHAR(100) NOT NULL,
    date_of_joining DATE NOT NULL,
    salary NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_employee_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
);

-- 3. Users Table (Authentication & JWT Authorization)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ROLE_ADMIN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Employee Audit Logs Table (Full historical timeline of changes)
CREATE TABLE IF NOT EXISTS employee_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    details VARCHAR(1000) NOT NULL,
    performed_by VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid search, filtering, and audit log lookups
CREATE INDEX IF NOT EXISTS idx_employee_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employee_full_name ON employees(full_name);
CREATE INDEX IF NOT EXISTS idx_employee_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employee_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employee_archived ON employees(archived);
CREATE INDEX IF NOT EXISTS idx_audit_employee_id ON employee_audit_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON employee_audit_logs(timestamp);

-- =============================================================================
-- 5. Row Level Security (RLS) for Supabase / PostgreSQL
-- Secures tables against direct public internet access via Supabase's PostgREST / anon key.
-- Spring Boot connects via JDBC as the table owner/superuser, which bypasses RLS by default.
-- =============================================================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_audit_logs ENABLE ROW LEVEL SECURITY;
