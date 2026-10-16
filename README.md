# Kohort Employee Management System (EMS)

![Java 17](https://img.shields.io/badge/Java-17%2B-orange?logo=openjdk)
![Spring Boot 3.4.3](https://img.shields.io/badge/Spring%20Boot-3.4.3-brightgreen?logo=springboot)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20(Supabase)-blue?logo=postgresql)
![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb?logo=react)
![Tests](https://img.shields.io/badge/Tests-Passing%20(JUnit%205%20%2B%20Mockito)-success)

A full-stack Employee Management System built with Spring Boot, PostgreSQL (Supabase), and React.

---

## 📋 Prerequisites

Before running the application, make sure the following tools are installed:
- **Java 17 or higher** (`java -version`)
- **Node.js 18 or higher** (`node -v` and `npm -v`)
- **Git**

> *Note: Maven is included in the project via the official Maven Wrapper (`./mvnw` or `.\mvnw.cmd`), so you do not need to install Maven globally.*

---

## 🛠️ Step-by-Step Setup & Installation

### Step 1: Database Setup (Supabase PostgreSQL)

1. Create a free account at [supabase.com](https://supabase.com).
2. Click **New Project**, enter a project name (e.g. `kohort-ems`), and set a secure database password.
3. Once the database is ready, go to **Project Settings** → **Database** → **Connection string** (URI).
4. Note your connection parameters:
   - **Host**: `aws-0-[region].pooler.supabase.com`
   - **Database**: `postgres`
   - **Port**: `5432` or `6543`
   - **Username**: `postgres.[your-project-ref]`
   - **Password**: `[your-database-password]`

> **Automatic Schema & Data Seeding**:
> When the backend starts up, Spring Boot automatically creates and updates all database tables (`ddl-auto: update`) and seeds the initial administrator account and core departments via `DataInitializer.java`. Reference SQL scripts are also provided in `backend/src/main/resources/schema.sql` and `backend/src/main/resources/data.sql`.

---

### Step 2: Configure Environment Variables

1. In the `backend/` directory, copy the example environment file:
   ```bash
   # Windows (PowerShell):
   cp backend/.env.example backend/.env
   ```

2. Open `backend/.env` and update it with your Supabase credentials:
   ```env
   SPRING_DATASOURCE_URL=jdbc:postgresql://YOUR_SUPABASE_HOST:5432/postgres?sslmode=require
   SPRING_DATASOURCE_USERNAME=postgres.YOUR_PROJECT_REF
   SPRING_DATASOURCE_PASSWORD=YOUR_ACTUAL_SUPABASE_PASSWORD
   JWT_SECRET=kohort_ems_super_secret_jwt_key_that_is_at_least_256_bits_long_2026
   PORT=8080
   ```

---

### Step 3: Run the Backend (Spring Boot)

1. Navigate to the `backend` folder and start the application:
   ```bash
   cd backend

   # On Windows:
   .\mvnw.cmd spring-boot:run

   # On Linux / macOS:
   ./mvnw spring-boot:run
   ```

2. The backend server will start at **`http://localhost:8080`**.
   - **Health Check**: `http://localhost:8080/`
   - **Interactive Swagger Documentation**: `http://localhost:8080/swagger-ui.html`

---

### Step 4: Run the Frontend (React + Vite)

1. Open a new terminal window, navigate to the `frontend` folder, and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🔑 Default Login Credentials

Use the pre-seeded administrator credentials to log in:
- **Username**: `admin`
- **Password**: `admin123`

*(You can also click the **Auto-fill Credentials** button on the login screen).*

---

## 🧪 Running Automated Unit Tests

To run the backend service-layer unit tests:

```bash
cd backend

# On Windows:
.\mvnw.cmd test

# On Linux / macOS:
./mvnw test
```

---

## 📬 Postman Collection

A pre-configured Postman collection is included in the repository at:
- `postman/Employee_Management_System.postman_collection.json`

**How to test:**
1. Open Postman → Click **Import** → Choose the collection file.
2. Execute the **Login (Admin)** request first — it automatically sets the authorization token for all subsequent requests.
3. Test any employee or department endpoint.
