# Contributing & Testing Guide

Welcome to the **Kohort Employee Management System (EMS)** contribution and testing guidelines.

---

## 📊 Test Suite Overview

| Test Layer | Framework | Test Count | Scope | Status |
| :--- | :--- | :---: | :--- | :---: |
| **Backend Service Layer** | JUnit 5 + Mockito 5 | **18 Tests** | Business logic, CRUD, validation, 13-day TTL rules, CSV export | ✅ 100% Passing |
| **Frontend Client Layer** | Vitest + React Testing Library | **17 Tests** | Date & currency formatting, number-to-words, UI badges, pagination | ✅ 100% Passing |
| **Total Automated Tests** | | **35 Tests** | | ✅ **100% Passing** |

---

## 🧪 Running Automated Tests

### 1. Backend Service-Layer Tests (JUnit 5 + Mockito)
The backend unit tests verify all business rules using Mockito in-memory mocks without needing a live database:

```bash
cd backend

# On Windows:
.\mvnw.cmd test

# On Linux / macOS:
./mvnw test
```

#### Test Classes & Coverage:
1. **`EmployeeServiceTest.java`** (12 tests):
   - Employee creation with duplicate email and duplicate ID checks.
   - Dynamic search by name, email, or employee ID.
   - Multi-criteria filtering by department and status.
   - Pagination and column sorting logic.
   - 13-day TTL archive soft-deletion and restore mechanism.
   - CSV export data streaming and field formatting.
2. **`DepartmentServiceTest.java`** (5 tests):
   - Department creation and duplicate name rejection.
   - Employee headcount aggregation per department.
   - Referential integrity safeguard: Blocks department deletion when active employees are assigned.
3. **`EmsApplicationTests.java`** (1 test):
   - Spring Boot ApplicationContext sanity load test.

---

### 2. Frontend Automated Tests (Vitest + React Testing Library)
The frontend test suite tests client-side formatting utilities and core reusable components in an isolated `jsdom` virtual DOM:

```bash
cd frontend
npm test
```

#### Test Files & Coverage:
1. **`src/utils/formatters.test.js`** (11 tests):
   - `formatDate`: Strict `dd-MMM-yyyy` format verification.
   - `formatCurrency`: Indian Rupee formatting with 2 decimal precision (`₹ 1,35,000.00`).
   - `numberToWords`: Real-time Indian English currency conversion (e.g. `1250000` → `Twelve Lakh Fifty Thousand Rupees`).
2. **`src/components/StatusBadge.test.jsx`** (3 tests):
   - Active status emerald green badge verification.
   - Inactive status ruby red badge verification.
   - Interactive click callback handling.
3. **`src/components/Pagination.test.jsx`** (3 tests):
   - Zero-state handling when no records exist.
   - Range calculation display ("Showing 1 to 10 of 25 records").
   - Page change button event triggering.

---

## ⏱️ Verifying the 13-Day TTL Archive Auto-Purge

The application implements a **13-Day Time-To-Live (TTL)** retention policy for soft-deleted employees.

### SQL Queries for Testing & Verification (Supabase SQL Editor):

#### Step 1: Simulate 14 Days Elapsed (Backdate an Archived Employee)
```sql
UPDATE employees 
SET archived = true, 
    archived_at = CURRENT_TIMESTAMP - INTERVAL '14 days' 
WHERE employee_id = 'EMP-1005';
```

#### Step 2: Inspect Archive Status and Elapsed Days
```sql
SELECT 
    employee_id, 
    full_name, 
    archived, 
    archived_at,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - archived_at)) AS days_in_archive,
    CASE 
      WHEN archived_at < CURRENT_TIMESTAMP - INTERVAL '13 days' 
        THEN 'ELIGIBLE FOR TTL PURGE (> 13 Days)'
      ELSE 'WITHIN 13-DAY RETENTION WINDOW'
    END AS ttl_status
FROM employees
WHERE archived = true;
```

#### Step 3: Execute the Automated TTL Purge Logic
```sql
DELETE FROM employees 
WHERE archived = true 
  AND archived_at < CURRENT_TIMESTAMP - INTERVAL '13 days';
```

#### Step 4: Confirm Permanent Deletion
```sql
SELECT employee_id, full_name, archived 
FROM employees 
WHERE employee_id = 'EMP-1005';
-- Result: 0 rows returned (permanently deleted)
```
