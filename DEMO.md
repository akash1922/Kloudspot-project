# Kohort EMS — Demonstration & Visual Showcase

[⬅ Back to Main README](README.md) &nbsp;|&nbsp; [🧪 Testing & TTL Verification Guide](TESTING.md) &nbsp;|&nbsp; 🚀 [Live App: Kohort EMS](https://kloudspot-project-red.vercel.app/)

This document provides visual demonstrations, key workflows, and screenshots of the **Kohort Employee Management System (EMS)**.

---

## 🔗 Live Application Links

* 🌐 **Live Web Application**: [https://kloudspot-project-red.vercel.app/](https://kloudspot-project-red.vercel.app/)
* 📖 **Live Interactive Swagger API Docs**: [https://kloudspot-project.onrender.com/swagger-ui.html](https://kloudspot-project.onrender.com/swagger-ui.html)
* ⚡ **Live Backend Health Status**: [https://kloudspot-project.onrender.com/](https://kloudspot-project.onrender.com/)

**Default Administrator Credentials**:
* **Username**: `admin`
* **Password**: `admin123`

---

## 📸 Key Features & Screen Showcase

### 1. Authentication & Seamless Light/Dark Mode
* **JWT-Secured Sign In**: Stateless token authentication with BCrypt password verification and automatic session persistence.
* **Auto-fill Demo Credentials**: One-click credential injection for instant evaluation.
* **Baby Pink & Midnight Obsidian Theme**: Seamless toggling between a high-contrast Baby Pink light mode and a sleek Midnight Obsidian dark mode.

---

### 2. Employee Directory (Search, Filter, Sort & Export)
* **Real-time Server Search**: Search instantly across Employee Name, Email, and Employee ID.
* **Multi-Criteria Filtering**: Filter by company department and employment status (Active vs. Inactive) with live headcount badges.
* **Server-Side Pagination**: Clean pagination with configurable page sizes (5, 10, 25, 50).
* **Multi-Format Export**: Download filtered records directly as **CSV (`.csv`)** or styled **Excel (`.xlsx`)**.

---

### 3. Excel & CSV Bulk Data Import with Live Staging Review
* **Universal File Parser**: Supports `.xlsx`, `.xls`, `.csv`, and tabular text imports.
* **Interactive Staging Modal**: Preview records in a live spreadsheet-style modal before saving them to the database.
* **Real-Time Row Validation**:
  - Highlights duplicate Employee IDs and Emails.
  - Validates strict 10-digit Indian phone numbers with fixed `+91` prefix.
  - Future date prevention using live network time.
  - In-line editable cells allow resolving errors directly in the modal before batch-saving.

---

### 4. Employee Profile & Comprehensive Audit Trail
* **Full Employee Details**: Displays complete employee profile, department, compensation, and contact information.
* **Historical Audit Timeline**: Logs every change (creation, field updates, status toggles, archiving, and restoration) with timestamps and the acting administrator's username.

---

### 5. Department Administration & Referential Safeguards
* **Division Oversight**: View, create, and edit company departments with real-time assigned staff counts.
* **Deletion Safeguard**: Actively blocks department deletion if employees are currently assigned to it, protecting database referential integrity.
* **Date Consistency**: Department created dates formatted consistently in `dd-MMM-yyyy` format.

---

### 6. 13-Day TTL Archive & Recovery Screen
* **Soft-Deletion with Retention**: Deleting an employee sends them to the Archive rather than immediate data loss.
* **Real-Time Countdown Timer**: Displays the remaining days/hours in the 13-day retention period.
* **One-Click Restoration**: Restore archived employees back to Active directory anytime within 13 days.
* **Automated Purge**: Permanently purges expired records after 13 days.

---

### 7. Interactive Form Validation & Real-Time Salary in Words
* **Real-Time Number to Words Converter**: As salary numbers are typed (e.g. `1250000`), the application immediately displays *"Twelve Lakh Fifty Thousand Rupees"* in real time.
* **Strict Format Enforcement**: Max 7-digit compensation limits and 10-digit mobile number rules.

---

## 🎥 Screen Recordings & Demonstrations

| Feature | Description | Format |
| :--- | :--- | :---: |
| **Full App Walkthrough** | Complete tour from login, search, bulk Excel import, to department management | Video / WebP |
| **Excel Import & Validation** | Demonstration of staging review modal, inline error correction, and batch saving | Video / WebP |
| **Dark Mode Switching** | Real-time contrast and theme toggle demonstration | GIF / Video |

> *Tip: You can experience all these features live directly in the deployed application: [https://kloudspot-project-red.vercel.app/](https://kloudspot-project-red.vercel.app/).*
