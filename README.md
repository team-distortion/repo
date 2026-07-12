# AssetFlow — Enterprise Asset & Resource Management System

AssetFlow is a modern, enterprise-grade application designed to track, allocate, book, and audit organizational physical and digital assets. It features a complete Express/PostgreSQL backend coupled with a premium, responsive React/Redux frontend.

---

## 🚀 Key Features

* **📦 Asset Directory & Tracking**: Track assets by tags, serial numbers, conditions, and locations. Detect shared vs. non-shared bookable assets.
* **🔄 Allocation & Transfers**: Allocate assets to employees or departments with expect-return guidelines. Request and approve asset transfers without double allocation.
* **📅 Resource Booking Engine**: A time-slot booking engine for shared resources (e.g. conference rooms, projectors) backed by PostgreSQL GiST exclusion checks to prevent overlapping reservations.
* **🔧 Maintenance Pipeline**: Flag assets for repair, assign technicians, track maintenance states, and automatically pause active asset allocations.
* **📋 Auditing & Verification Cycles**: Schedule audit scopes (by location or department), assign auditors, record check-ins (Verified, Missing, Damaged), and log discrepancy reports.
* **⚙️ Organization Setup**: Manage company departments, dynamic asset categories with custom attributes (e.g. RAM, warranty, resolution), and an employee directory with role-based access.

---

## 🛠️ Technology Stack

* **Backend**: Node.js, Express, TypeScript, node-postgres (`pg`), JSON Web Tokens (JWT) for secure authentication.
* **Frontend**: React 19, Redux Toolkit (RTK Query), Tailwind CSS v4, Lucide React (icons), React Router v7.
* **Database**: PostgreSQL 16 (running in Docker Container).

---

## 📁 Repository Structure

```text
/                               <-- Backend Root Directory
├── src/                        <-- Backend Source Code
│   ├── config/                 <-- Configuration and .env loading
│   ├── database/               <-- SQL schema and seed files
│   ├── middleware/             <-- JWT validation, error handling, pagination
│   └── modules/                <-- API route controllers (users, assets, bookings, etc.)
├── assetflow/
│   └── assetflow-frontend/     <-- Frontend Root Directory
│       ├── src/
│       │   ├── components/     <-- Reusable UI components & layouts
│       │   ├── pages/          <-- Tab views (Dashboard, Setup, Assets)
│       │   ├── store/          <-- Redux store & RTK Query Slice
│       │   └── utils/          <-- API request helpers
```

---

## 🏁 How to Start the Application

Follow these steps to set up and run the project locally.

### Prerequisites
* **Node.js** (version 18 or higher recommended)
* **Docker & Docker Compose** (for running the PostgreSQL instance)

---

### Step 1: Set Up the Database

1. Navigate to the repository root directory:
   ```bash
   cd "/d/Ashish/Sanidhiya work/Asset-flow-by-TeamDistortion/repo"
   ```
2. Start the PostgreSQL container in detached mode:
   ```bash
   docker-compose up -d
   ```
3. Run migrations to initialize the database tables:
   ```bash
   npm run db:migrate
   ```
4. Seed the database with mock organization data and the default admin user:
   ```bash
   npm run db:seed
   ```

---

### Step 2: Configure & Start the Backend

The backend is located in the **root directory (`/`)**.

1. Create a `.env` file in the root directory (you can copy `.env.example` as a template):
   ```bash
   cp .env.example .env
   ```
2. Run npm install to fetch backend node modules:
   ```bash
   npm install
   ```
3. Launch the backend server in development mode (starts on port `3000` by default):
   ```bash
   npm run dev
   ```

---

### Step 3: Configure & Start the Frontend

The frontend is located in the **`/assetflow/assetflow-frontend`** folder.

1. Navigate to the frontend directory:
   ```bash
   cd assetflow/assetflow-frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Run the frontend Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web app in your browser at `http://localhost:5173`.

---

## 🔑 Default Admin Credentials

Once you seed the database, you can log in to the setup page using the default administrator account:
* **Email**: `admin@assetflow.com`
* **Password**: `Admin@123`
