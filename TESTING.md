# Automated Testing & Verification Guide

[⬅ Back to Main README](README.md) &nbsp;|&nbsp; [📸 Screenshots & Demo](DEMO.md) &nbsp;|&nbsp; 🚀 [Live App: Kohort EMS](https://kloudspot-project-red.vercel.app/)

This document provides complete instructions for executing the automated backend tests, frontend tests, and verifying the **13-Day TTL (Time-To-Live) Archive Auto-Purge** mechanism.

---

## 📊 Test Suite Overview

| Test Layer | Framework | Test Count | Scope |
| :--- | :--- | :---: | :--- |
| **Backend Service Layer** | JUnit 5 + Mockito 5 | **18 Tests** | Business logic, CRUD, validation, 13-day TTL rules, CSV export |
| **Frontend Client Layer** | Vitest + React Testing Library | **17 Tests** | Date & currency formatting, number-to-words, UI badges, pagination |
| **Total Automated Tests** | | **35 Tests** | **100% Passing** |

---

## 1. Backend Service-Layer Tests (JUnit 5 + Mockito)

The backend unit tests verify all core service-layer business rules using Mockito in-memory mocks. They run independently without requiring a live PostgreSQL instance or running server.

### How to Run:
```bash
cd backend

# On Windows:
.\mvnw.cmd test

# On Linux / macOS:
./mvnw test
```

### Test Classes & Coverage:
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

## 2. Frontend Automated Tests (Vitest + React Testing Library)

The frontend test suite tests client-side formatting utilities and core reusable components in an isolated `jsdom` virtual DOM. It runs completely offline without needing the backend or database running.

### How to Run:
```bash
cd frontend
npm test
```

### Test Files & Coverage:
1. **`src/utils/formatters.test.js`** (11 tests):
   - `formatDate`: Formats ISO date strings to strict `dd-MMM-yyyy` (e.g. `15-Oct-2026`).
   - `formatCurrency`: Formats monetary values with Indian Rupee symbol and 2 decimal precision (`₹ 1,35,000.00`).
   - `numberToWords`: Converts numeric compensation to Indian English words in real time (e.g., `1250000` → `Twelve Lakh Fifty Thousand Rupees`).
2. **`src/components/StatusBadge.test.jsx`** (3 tests):
   - Verifies Active status styling with emerald green badge.
   - Verifies Inactive status styling with ruby red badge.
   - Verifies interactive click callback handling.
3. **`src/components/Pagination.test.jsx`** (3 tests):
   - Verifies zero-state handling when no records exist.
   - Verifies range calculation display ("Showing 1 to 10 of 25 records").
   - Verifies page change button event triggering.

---

## 3. Verifying the 13-Day TTL Archive Auto-Purge

The application implements a **13-Day Time-To-Live (TTL)** retention policy for deleted employees:
* When an employee is deleted in the UI, they are **soft-deleted** (`archived = true`, `archived_at = CURRENT_TIMESTAMP`).
* During the 13-day window, administrators can view and **restore** the employee from the Archive page.
* After **13 days** have elapsed, records are permanently deleted (purged) from the database.

### How an Evaluator / Reviewer Can Test the 13-Day TTL Purge:

In your **Supabase Dashboard** (or local PostgreSQL), open the **SQL Editor** and run the following queries to test and verify the TTL purge mechanism:

#### Step 1: Simulate 14 Days Elapsed (Backdate an Archived Employee)
```sql
-- Artificially backdate an archived employee to 14 days ago for testing
UPDATE employees 
SET archived = true, 
    archived_at = CURRENT_TIMESTAMP - INTERVAL '14 days' 
WHERE employee_id = 'EMP-1005';
```

#### Step 2: Inspect Archive Status and Elapsed Days
```sql
-- View archived employees, their elapsed time, and TTL status
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
-- This is the automated purge query executed by the cleanup routine:
DELETE FROM employees 
WHERE archived = true 
  AND archived_at < CURRENT_TIMESTAMP - INTERVAL '13 days';
```

#### Step 4: Confirm Permanent Deletion
```sql
-- Verify that the backdated record has been completely purged
SELECT employee_id, full_name, archived 
FROM employees 
WHERE employee_id = 'EMP-1005';
-- Result: 0 rows returned (permanently deleted)
```
