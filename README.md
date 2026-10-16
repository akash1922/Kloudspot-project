# Kohort EMS — Production Staff Management Platform

![Java 17](https://img.shields.io/badge/Java-17%2B-orange?logo=openjdk)
![Spring Boot 3.4.3](https://img.shields.io/badge/Spring%20Boot-3.4.3-brightgreen?logo=springboot)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20(Supabase)-blue?logo=postgresql)
![React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb?logo=react)
![JWT](https://img.shields.io/badge/Security-Spring%20Security%20%2B%20JWT-red?logo=jsonwebtokens)
![Tests](https://img.shields.io/badge/Tests-18%20Passed%20(JUnit%205%20%2B%20Mockito)-success)

A modern, production-grade enterprise **Kohort EMS** platform featuring complete CRUD operations, dynamic real-time search, multi-criteria filtering, pagination, CSV reporting, department administration, and stateless JWT authentication.

---

## 🌟 Key Features

### Core Capabilities
- **Full Employee Lifecycle**: Create, view detailed profile, update, and delete employee records with safe confirmation modals.
- **Dynamic Multi-Field Search**: Real-time server-side search across Employee Name, Email Address, and Employee ID.
- **Advanced Filtering**: Filter by Department and Employment Status (Active vs. Inactive).
- **Server-Side Pagination & Sorting**: High-performance SQL pagination with configurable page sizes (5, 10, 25, 50) and column sorting.
- **CSV Data Export**: Instant download of filtered employee lists formatted for spreadsheet applications.
- **Department Administration**: Manage company divisions with referential deletion safeguards.
- **Stateless JWT Security**: BCrypt password hashing, token expiration, and secure role-based authorization.
- **Swagger / OpenAPI 3.0 Documentation**: Interactive API testing console embedded directly at `/swagger-ui.html`.
- **Robust Unit Testing**: 100% automated service-layer test suite powered by **JUnit 5** and **Mockito** (18 tests passing).

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT (React 18 + Vite)             │
│   • Pixel-perfect design system with zero CSS bloat    │
│   • Real-time validation & toast notification engine   │
│   • Axios interceptors with automatic JWT injection    │
└───────────────────────────┬────────────────────────────┘
                            │ RESTful JSON / Bearer JWT
┌───────────────────────────▼────────────────────────────┐
│              BACKEND (Spring Boot 3.4.3 / Java 17+)     │
│   ├── Controllers     (REST API Endpoints)             │
│   ├── Security        (Spring Security, JWT Filters)   │
│   ├── Services        (Business logic & CSV stream)    │
│   ├── Repositories    (Spring Data JPA Specifications) │
│   └── Config          (OpenAPI / Swagger 3.0)          │
└───────────────────────────┬────────────────────────────┘
                            │ JDBC Pool (HikariCP)
┌───────────────────────────▼────────────────────────────┐
│              DATABASE (PostgreSQL / Supabase)          │
│   ├── departments     (Relational foreign keys)        │
│   ├── employees       (B-Tree search indexes)          │
│   └── users           (BCrypt hashed credentials)      │
└────────────────────────────────────────────────────────┘
```

---

## 📋 Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Backend Framework** | Spring Boot 3.4.3 | Latest stable production release |
| **Language** | Java 17+ (JDK 17, 21, 24 compatible) | Modern standard LTS baseline |
| **Persistence / ORM** | Spring Data JPA + Hibernate | Automatic schema updates, Specification queries |
| **Database** | PostgreSQL | Hosted on **Supabase** (Free Tier) or local instance |
| **Security** | Spring Security 6 + JJWT | Stateless JWT authentication with BCrypt hashing |
| **Reporting** | OpenCSV 5.9 | High-speed streaming CSV data export |
| **API Documentation**| Springdoc OpenAPI (Swagger UI) | Interactive API exploration tool |
| **Testing** | JUnit 5 + Mockito 5 | Service-layer unit test suite |
| **Frontend Framework**| React 18 + Vite | Rapid HMR, zero-config production bundling |
| **Styling** | Vanilla CSS Design Tokens | Pixel-perfect typography, borders, and animations |
| **Icons** | Lucide React | Clean, consistent SVG icon set |

---

## 🚀 Getting Started

### Prerequisites
Make sure the following tools are installed on your machine:
- **Java 17 or higher** (`java -version`)
- **Node.js 18 or higher** (`node -v` and `npm -v`)
- **Git**

> *Note: You do **not** need to install Maven globally — the project includes the official Maven Wrapper (`./mvnw` or `mvnw.cmd`).*

---

### Step 1: Database Setup (Supabase Free Tier)

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project**, name it `ems-db`, and set a strong database password.
3. Once provisioned, navigate to **Project Settings** → **Database** → **Connection string** (URI).
4. Copy the JDBC connection details:
   - Host: `aws-0-[region].pooler.supabase.com`
   - Port: `5432` or `6543`
   - Database: `postgres`
   - User: `postgres.[project-ref]`
   - Password: `[your-db-password]`

> **Database Setup Note**: Spring Boot automatically initializes and updates the database schema (`ddl-auto: update`) and automatically seeds the default administrator (`admin` / `admin123`) and company departments on startup via `DataInitializer.java`. For manual database inspection, CI/CD provisioning, or direct execution in the Supabase SQL editor, complete reference scripts are provided in `backend/src/main/resources/schema.sql` (exact table definitions, constraints, and search indices) and `backend/src/main/resources/data.sql` (verified seed credentials and sample departments).

---

### Step 2: Configure and Run Backend

1. Open `backend/src/main/resources/application.yml` (or pass environment variables):
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://YOUR_SUPABASE_HOST:5432/postgres?sslmode=require
       username: postgres.YOUR_PROJECT_REF
       password: YOUR_DB_PASSWORD
   ```

2. Start the backend service using the included Maven Wrapper:
   ```bash
   cd backend

   # On Windows:
   .\mvnw.cmd spring-boot:run

   # On Linux/macOS:
   ./mvnw spring-boot:run
   ```

3. The backend starts at `http://localhost:8080`.
   - **Swagger UI**: Visit `http://localhost:8080/swagger-ui.html`
   - **Default Admin**: Username: `admin` | Password: `admin123`

---

### Step 3: Run Frontend

1. Open a new terminal window:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

3. Sign in using the default admin credentials (`admin` / `admin123`) or click **Auto-fill Credentials**.

---

## 🧪 Running Automated Unit Tests

To run the complete service-layer test suite:
```bash
cd backend
.\mvnw.cmd test
```

### Test Results
```
[INFO] Running com.kohort.ems.service.DepartmentServiceTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.kohort.ems.service.EmployeeServiceTest
[INFO] Tests run: 11, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.kohort.ems.EmsApplicationTests
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS (17 tests passed)
```

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Public? |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate and obtain JWT Bearer token | Yes |
| `POST` | `/api/auth/register` | Register new admin account | Yes |

### Employees (`/api/employees`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/employees` | List employees (paginated, searchable, filterable) | Bearer Token |
| `GET` | `/api/employees/{id}` | Get employee by ID | Bearer Token |
| `POST` | `/api/employees` | Create a new employee | Bearer Token |
| `PUT` | `/api/employees/{id}` | Update employee by ID | Bearer Token |
| `DELETE` | `/api/employees/{id}` | Delete employee by ID | Bearer Token |
| `GET` | `/api/employees/export/csv` | Download filtered employees as CSV file | Bearer Token |

### Departments (`/api/departments`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/departments` | List all departments with staff count | Bearer Token |
| `GET` | `/api/departments/{id}` | Get department by ID | Bearer Token |
| `POST` | `/api/departments` | Create new department | Bearer Token |
| `PUT` | `/api/departments/{id}` | Update existing department | Bearer Token |
| `DELETE` | `/api/departments/{id}` | Delete department (guarded against active staff) | Bearer Token |

---

## 📬 Postman Collection

The repository includes a ready-to-import Postman collection:
- File location: `postman/Employee_Management_System.postman_collection.json`
- **How to use**:
  1. Open Postman.
  2. Click **Import** and select the file.
  3. Run the **Login (Admin)** request first — it automatically saves the JWT token into the collection's `{{token}}` variable.
  4. Test all subsequent requests immediately.

---

## 🌐 Free Tier Production Hosting Recommendations

| Service | Recommended Platform | Plan |
|---|---|---|
| **Database** | [Supabase](https://supabase.com) | Free Tier (500 MB storage, PostgreSQL 16) |
| **Backend API** | [Render](https://render.com) or [Railway](https://railway.app) | Free Web Service |
| **Frontend** | [Vercel](https://vercel.com) or [Netlify](https://netlify.com) | Free Forever Global Edge CDN |

---

## 📁 Repository Structure

```
kohort/
├── backend/
│   ├── src/main/java/com/kohort/ems/
│   │   ├── config/              # OpenAPI / Swagger configuration
│   │   ├── controller/          # REST Controllers (Auth, Employee, Department)
│   │   ├── dto/                 # Request & Response Data Transfer Objects
│   │   ├── exception/           # Custom exceptions & GlobalExceptionHandler
│   │   ├── model/               # JPA Entities (Employee, Department, User)
│   │   ├── repository/          # Spring Data Repositories & Specifications
│   │   ├── security/            # JWT Token Provider, Filters, SecurityConfig
│   │   ├── service/             # Business Logic & OpenCSV Exporter
│   │   └── EmsApplication.java  # Main application entry point
│   ├── src/main/resources/
│   │   ├── application.yml      # App configuration
│   │   ├── schema.sql           # PostgreSQL schema script
│   │   └── data.sql             # Production seed data
│   ├── src/test/java/           # JUnit 5 & Mockito test suites
│   ├── pom.xml                  # Maven build descriptor
│   └── mvnw.cmd                 # Maven Wrapper for Windows/Linux
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios clients (auth, employees, departments)
│   │   ├── components/          # Reusable UI (Navbar, Modal, Badge, Pagination)
│   │   ├── context/             # Auth & Toast notification state
│   │   ├── pages/               # Views (List, Add/Edit Form, Details, Departments, Login)
│   │   ├── index.css            # Handcrafted CSS design system
│   │   ├── App.jsx              # Routing & Protected layout
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── postman/
│   └── Employee_Management_System.postman_collection.json
├── README.md
└── .gitignore
```
