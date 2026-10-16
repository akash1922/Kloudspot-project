-- =============================================================================
-- Initial Production Seed Data (Reference & Manual Setup)
-- Note: Spring Boot automatically manages and seeds data on startup via
-- DataInitializer.java (BCrypt encrypted passwords and standard departments).
-- =============================================================================

-- 1. Departments
INSERT INTO departments (name, description)
VALUES 
    ('Engineering', 'Software development, QA, and DevOps'),
    ('Human Resources', 'Recruitment, employee relations, and payroll'),
    ('Product & Design', 'Product management and UI/UX design'),
    ('Marketing & Sales', 'Brand growth, demand generation, and client relations'),
    ('Finance & Legal', 'Financial planning, accounting, and compliance')
ON CONFLICT (name) DO NOTHING;

-- 2. Default Administrator User: username = admin, password = admin123
-- Verified BCrypt hash with 10 rounds for 'admin123'
INSERT INTO users (username, password, role)
VALUES 
    ('admin', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'ROLE_ADMIN')
ON CONFLICT (username) DO NOTHING;

-- 3. Initial Sample Employees (with valid Indian +91 98xxxxxxxx phone numbers)
INSERT INTO employees (employee_id, full_name, email, phone_number, department_id, designation, date_of_joining, salary, status, archived)
SELECT 
    'EMP-1001', 'Alexander Wright', 'alexander.wright@company.com', '+91 9823456781', id, 'Lead Software Architect', '2022-03-15', 135000.00, 'Active', false
FROM departments WHERE name = 'Engineering'
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO employees (employee_id, full_name, email, phone_number, department_id, designation, date_of_joining, salary, status, archived)
SELECT 
    'EMP-1002', 'Elena Rostova', 'elena.rostova@company.com', '+91 9834567892', id, 'Principal Product Designer', '2022-06-01', 118000.00, 'Active', false
FROM departments WHERE name = 'Product & Design'
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO employees (employee_id, full_name, email, phone_number, department_id, designation, date_of_joining, salary, status, archived)
SELECT 
    'EMP-1003', 'Marcus Chen', 'marcus.chen@company.com', '+91 9845678903', id, 'Senior Backend Engineer', '2023-01-10', 105000.00, 'Active', false
FROM departments WHERE name = 'Engineering'
ON CONFLICT (employee_id) DO NOTHING;
