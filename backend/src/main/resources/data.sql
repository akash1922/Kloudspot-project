-- =============================================================================
-- Initial Production Seed Data
-- =============================================================================

-- Departments
INSERT INTO departments (name, description)
VALUES 
    ('Engineering', 'Software development, QA, and DevOps'),
    ('Human Resources', 'Recruitment, employee relations, and payroll'),
    ('Product & Design', 'Product management and UI/UX design'),
    ('Marketing & Sales', 'Brand growth, demand generation, and client relations'),
    ('Finance & Legal', 'Financial planning, accounting, and compliance')
ON CONFLICT (name) DO NOTHING;

-- Default Administrator User: username = admin, password = admin123 ($2a$10$wK1c6f... bcrypt)
INSERT INTO users (username, password, role)
VALUES 
    ('admin', '$2a$10$7Z2vYk6t8PqH9u6M7eJtUe.Xq2Uo5.d6yqOqX3jLqG3r8bF3H5m4y', 'ROLE_ADMIN')
ON CONFLICT (username) DO NOTHING;
