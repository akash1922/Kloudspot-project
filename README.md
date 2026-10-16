# Kohort Employee Management System (EMS)

A full-stack Employee Management System built with Spring Boot, PostgreSQL (Supabase), and React.

---

### 🌐 Live Application & Resources

* 🚀 **Live Web Application**: [Kohort EMS](https://kloudspot-project-red.vercel.app/) *(Click to open live deployed app)*
* 📖 **Live Interactive Swagger API Docs**: [Swagger UI](https://kloudspot-project.onrender.com/swagger-ui.html)
* ⚡ **Live Backend Health Status**: [Render Health Endpoint](https://kloudspot-project.onrender.com/)

---

## 📋 Prerequisites

Before running the application, make sure the following tools are installed:
- **Java 17 or higher** (`java -version`)
- **Node.js 18 or higher** (`node -v` and `npm -v`)
- **Git**

> *Note: Maven is included in the project via the official Maven Wrapper (`./mvnw` or `.\mvnw.cmd`), so you do not need to install Maven globally.*

---

## 🛠️ Step-by-Step Setup & Installation

### Step 1: Database Setup & Connection Keys (Supabase PostgreSQL)

1. Create a free account at [supabase.com](https://supabase.com).
2. Click **New Project**, enter a project name (e.g. `kohort-ems`), and set a secure database password.
3. **Generate / Copy Connection Keys**:
   - In your Supabase Dashboard, open your database view.
   - Look at the top navigation bar (next to `main / PRODUCTION`) and click the **Connect** button.
   - In the modal that appears, select **Direct connection** or **Session pooler** (recommended for serverless/pooled connections).
   - All connection details will be displayed ready to copy:
     - **Host**: `aws-0-[region].pooler.supabase.com`
     - **Database**: `postgres`
     - **Port**: `5432` or `6543`
     - **User**: `postgres.[your-project-ref]` (or `postgres` for direct)
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

## 🧪 Running Automated Tests (35 Tests Total)

The project includes **35 automated tests** across both backend and frontend layers (100% passing):

| Layer | Framework | Tests | Scope | Status |
| :--- | :--- | :---: | :--- | :---: |
| **Backend Service Layer** | JUnit 5 + Mockito | 18 | Business logic, CRUD, validation, 13-day TTL rules, CSV export | ✅ Passing |
| **Frontend Utilities & UI** | Vitest + React Testing Library | 17 | Date & currency formatting, number-to-words, UI badges, pagination | ✅ Passing |
| **Total Automated Tests** | | **35** | Complete test coverage | ✅ **100% Passing** |

### 1. Run Backend Tests (18 Tests)
```bash
cd backend

# Windows:
.\mvnw.cmd test

# Linux / macOS:
./mvnw test
```

### 2. Run Frontend Tests (17 Tests)
```bash
cd frontend
npm test
```

> 📖 **Full Testing & 13-Day TTL Verification Guide**:  
> For the comprehensive test class breakdown, Mockito mocks, and the step-by-step **13-Day TTL Archive Auto-Purge SQL queries**, see the **[Contributing Tab (CONTRIBUTING.md)](CONTRIBUTING.md)** (rendered right beside this README tab on GitHub).

---

## 📸 Visual Showcase & Screen Recordings

Experience all features live at: **[Kohort EMS](https://kloudspot-project-red.vercel.app/)**

### 🎥 Demo Video & Screen Recordings
<!-- Add your video clip / screen recording link or embed directly below: -->
> 📹 *Demo clip / video walkthrough will be added here directly.*

### ✨ Key Features & System Tour

| Feature | Key Highlights |
| :--- | :--- |
| **Authentication & Theme** | JWT security, BCrypt hashing, one-click Auto-fill Demo Credentials, and seamless Baby Pink (Light) & Midnight Obsidian (Dark) themes. |
| **Employee Directory** | Live server-side search across ID/Name/Email, multi-criteria filtering by department and status, server-side pagination, and dual CSV & Excel (`.xlsx`) export. |
| **Bulk Excel / CSV Import** | Drag-and-drop file upload with an interactive staging review modal, real-time error detection (duplicates, invalid Indian +91 numbers, future dates), and inline cell editing before saving. |
| **Profile & Audit Trail** | Detailed employee card, department assignment, and a complete historical timeline logging who created, updated, archived, or restored each record. |
| **13-Day Retention Archive** | Dedicated archive screen with real-time retention countdown timer, one-click restoration, and automated 13-day purge. |
| **Department Management** | Division oversight with live employee headcount aggregation and referential integrity protection (blocks deleting departments with active staff). |
| **Real-Time Salary in Words** | Dynamic conversion of compensation figures into Indian English words (e.g., `1250000` → *"Twelve Lakh Fifty Thousand Rupees"*). |

---

## 📬 Postman Collection

A pre-configured Postman collection is included in the repository at:
- `postman/Employee_Management_System.postman_collection.json`

**How to test:**
1. Open Postman → Click **Import** → Choose the collection file.
2. Execute the **Login (Admin)** request first — it automatically sets the authorization token for all subsequent requests.
3. Test any employee or department endpoint.


