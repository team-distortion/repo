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

## ✅ Prerequisites

Before you begin, ensure the following tools are installed on your machine:

* **Node.js** v18 or higher — [Download here](https://nodejs.org/)
* **Docker Desktop** — [Download here](https://www.docker.com/products/docker-desktop/) (must be running before the database steps)

> [!IMPORTANT]
> If you already have **PostgreSQL installed natively** on your computer (not via Docker), it likely occupies port `5432` by default. This will **conflict** with the Docker database container and cause an `authentication failed` or `connection refused` error.
>
> **Fix**: Stop your local PostgreSQL service before running Docker:
> - **Windows (PowerShell as Administrator):** `Stop-Service -Name postgresql*`
> - **Mac:** `brew services stop postgresql`

---

## 🏁 How to Start the Application

Follow these steps **in order** on a fresh clone of the repository.

---

### Step 1: Set Up & Configure the Backend

The backend is located in the **root directory (`/`)**.

1. Create a `.env` file by copying the example template:
   ```bash
   cp .env.example .env
   ```
   > The `.env` file is not included in the repository (it contains secrets). You must create it yourself using `.env.example` as the template. The default values work out of the box for local development.

2. Install backend dependencies:
   ```bash
   npm install
   ```

---

### Step 2: Set Up the Database

> [!IMPORTANT]
> Make sure **Docker Desktop is running** before executing these commands.

1. Start the PostgreSQL container in detached mode:
   ```bash
   docker-compose up -d
   ```
   Verify it started successfully by running `docker ps` — you should see a Postgres container listed as `Up`.

2. Run migrations to initialize the database tables:
   ```bash
   npm run db:migrate
   ```

3. Seed the database with sample data and the default admin user:
   ```bash
   npm run db:seed
   ```

---

### Step 3: Start the Backend

1. Launch the backend server in development mode (runs on port `3000` by default):
   ```bash
   npm run dev
   ```

---

### Step 4: Configure & Start the Frontend

The frontend is located in the **`/assetflow/assetflow-frontend`** folder. Open a **new terminal** for this step.

1. Navigate to the frontend directory:
   ```bash
   cd assetflow/assetflow-frontend
   ```

2. Create a `.env` file by copying the example template:
   ```bash
   cp .env.example .env
   ```

3. Install frontend dependencies:
   ```bash
   npm install
   ```

4. Run the frontend Vite development server:
   ```bash
   npm run dev
   ```

5. Access the web app in your browser at `http://localhost:5173`.

---

## 🔑 Default Admin Credentials

Once you seed the database, you can log in using the default administrator account:

| Field | Value |
|---|---|
| Email | `admin@assetflow.com` |
| Password | `Admin@123` |

---

## 🐛 Common Setup Issues & Fixes

### ❌ `password authentication failed for user "assetflow_user"`
This means the Docker database was initialized with different credentials than what's in your `.env` file (or no `.env` file existed when Docker first ran). Fix it by wiping the old database volume and re-initializing:
```bash
docker-compose down -v
docker-compose up -d
npm run db:migrate
npm run db:seed
```

### ❌ `connect ECONNREFUSED 127.0.0.1:5432`
The backend cannot find a running database. Either Docker is not running, or the container failed to start. Check `docker ps` to see container status, and ensure Docker Desktop is open.

### ❌ `error: relation "users" does not exist`
The database is connected but the migration was not run successfully. Run:
```bash
npm run db:migrate
npm run db:seed
```

### ❌ `vite: command not found` or `npm run dev` fails in the frontend
You haven't installed frontend dependencies yet. Run `npm install` inside the `assetflow/assetflow-frontend` directory.

### ❌ Frontend running on port `5174` instead of `5173`
This happens when port `5173` is already occupied by another process on your machine (e.g. another running instance of this app). Stop the other instance, then re-run `npm run dev`. Alternatively, your backend's `CORS_ORIGIN` in `.env` must include the port your frontend is actually running on.
