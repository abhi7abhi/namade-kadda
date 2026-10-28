# NAMADE KADDA (ನಮ್ಮದೇ ಕಡ್ಡ)
> **Source Globally. Build Intelligently.**  
> *AI-Powered Industrial B2B Sourcing, Component Discovery, and Procurement Marketplace.*

---

## 1. Executive Summary & Architecture

**Namade Kadda** is an enterprise-grade B2B sourcing marketplace connecting global buyers, verified industrial manufacturers, and procurement administrators.

### Core Capabilities:
- **Buyer Workspace**: Discover global suppliers, AI Procurement Council (deep component breakdown for Smartphones, Laptops, and Desktop PCs), Relevant Suppliers matching, Sourcing Requests, Multi-attribute RFQ evaluations, BOM builder with CSV export, Landed Cost calculator with ReportLab PDF reports, and Purchase Order tracking.
- **Supplier Workspace**: Multi-state catalog management (Draft, Published, Archived), Relevant Buyers discovery, real-time incoming RFQs, decimal-safe itemized quotations with revision history, counteroffer negotiations, shop-floor order milestone advancement, 6-role AI Seller Assistant, and commercial telemetry with CSV export.
- **Admin Workspace**: Platform GMV metrics, Sourcing Requests audit & monitoring, business document verification, user complaints resolution workflow, and account activation controls.
- **Database Engine**: Production-ready MongoDB Atlas support (`mongodb+srv://`) with dynamic fallbacks, fully populated seed datasets, and zero data reset on redeployment.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NAMADE KADDA CLOUD TOPOLOGY                     │
├───────────────────────────────────┬────────────────────────────────────┤
│  Frontend (Vercel)                │  Backend (Render / Cloud Host)     │
│  - Next.js 16 (App Router)        │  - FastAPI (Python 3.10+)          │
│  - React 19 & TypeScript          │  - Pydantic v2 & PyJWT auth        │
│  - Tailwind CSS                   │  - Motor / PyMongo Driver          │
│  - Lucide Icons & Recharts        │  - ReportLab PDF Generation        │
│  - Base URL normalization         │  - CORS wildcard (*.vercel.app)    │
├───────────────────────────────────┼────────────────────────────────────┤
│  Database (MongoDB Atlas)         │  AI Intelligence Engine            │
│  - MongoDB Atlas Cloud Cluster    │  - 6 Specialist Buyer Agents       │
│  - Collections: users, suppliers, │  - 6 Specialist Seller Roles       │
│    products, rfqs, quotations,    │  - Component Intelligence Engine   │
│    orders, sourcing_requests,     │  - Dual LLM: Mock / Gemini /      │
│    complaints, documents, etc.    │    OpenAI Adapter                  │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 2. Seeded Demonstration Accounts

| Role | Email Address | Password | Dedicated Workspace |
| :--- | :--- | :--- | :--- |
| **Enterprise Buyer** | `buyer@namadekadda.demo` | `NmkBuyer@2026` | `/dashboard/buyer` — Component Discovery, Relevant Suppliers, RFQ creation, PO tracking |
| **Industrial Supplier** | `supplier@namadekadda.demo` | `NmkSupplier@2026` | `/dashboard/supplier` — Catalog inventory, Relevant Buyers, Quotation authoring, Order milestones |
| **Platform Administrator** | `admin@namadekadda.demo` | `NmkAdmin@2026` | `/dashboard/admin` — Sourcing Requests monitor, Document verification, Complaints resolution |

> **Quick Access**: The `/login` page features a one-click demo account selector that populates credentials instantly.

---

## 3. Master Cloud Deployment Guide

Follow these 4 clear steps to deploy Namade Kadda to the internet for free using **GitHub**, **MongoDB Atlas**, **Render**, and **Vercel**.

```
  [1. GitHub Repo] ──┬──> [3. Render (Backend API)] ──> [2. MongoDB Atlas (Cloud DB)]
                     │             ▲
                     │             │ (API Calls / CORS)
                     └──> [4. Vercel (Frontend Next.js)]
```

---

### Step 1: Upload Project to GitHub

1. Open your terminal in the project root:
   ```powershell
   cd C:\Users\abhin\Downloads\namade-kadda
   ```
2. Verify that `git status` shows a clean staging area without `.env`, local `.db` files, or `node_modules`.
3. Create a new repository on [GitHub](https://github.com/new) named `namade-kadda` (choose **Public** or **Private**, do NOT initialize with a README).
4. Link and push your repository:
   ```powershell
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/namade-kadda.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 2: Set Up MongoDB Atlas (Cloud Database)

1. Sign in or register at [MongoDB Cloud Atlas](https://cloud.mongodb.com/).
2. Create a **Free Shared Cluster** (M0, free forever):
   - Provider: AWS / Google Cloud (choose your nearest region).
   - Cluster Name: `NamadeKaddaCluster` (or leave default `Cluster0`).
3. Set up **Database Access (User)**:
   - Navigate to **Security** $\to$ **Database Access** $\to$ **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: `namade_admin`.
   - Password: Choose a secure password (e.g., `SecurePass2026!`).
   - Database User Privileges: **Read and write to any database** (`readWriteAnyDatabase`).
4. Set up **Network Access (IP Whitelist)**:
   - Navigate to **Security** $\to$ **Network Access** $\to$ **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`).
   - Click **Confirm** (essential for Render and Vercel cloud servers).
5. Obtain the **Connection String**:
   - Navigate to **Deployment** $\to$ **Database** $\to$ Click **Connect**.
   - Choose **Drivers** (Python 3.12+).
   - Copy the URI:
     `mongodb+srv://namade_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=NamadeKaddaCluster`
   - Replace `<password>` with your actual password.

---

### Step 3: Deploy Backend on Render

1. Sign in to [Render.com](https://render.com/) with GitHub.
2. Click **New +** $\to$ **Web Service**.
3. Select **Build and deploy from a Git repository** $\to$ Connect your `namade-kadda` repository.
4. Fill in the service configuration:
   - **Name**: `namade-kadda-backend`
   - **Region**: Choose the region closest to your MongoDB Atlas cluster.
   - **Branch**: `main`
   - **Root Directory**: `backend` *(CRITICAL: Must be `backend`)*
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. In **Advanced Settings**, add the following **Environment Variables**:

| Variable Name | Recommended Value / Description |
| :--- | :--- |
| `MONGODB_URL` | Your MongoDB Atlas connection URI (`mongodb+srv://namade_admin:...`) |
| `MONGODB_DATABASE` | `namade_kadda` |
| `JWT_SECRET` | Generate a 32+ character random secret (e.g., run `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `CORS_ORIGINS` | `*` (or your Vercel URL once known) |
| `LLM_PROVIDER` | `mock` (or `gemini` if providing `GEMINI_API_KEY`) |
| `GEMINI_API_KEY` | *(Optional)* Your Google AI Studio API key |

6. In **Health Check Path**, enter: `/api/v1/health`
7. Click **Create Web Service**.
8. Wait for the build to finish. Once live, copy your Render service URL:
   `https://namade-kadda-backend.onrender.com`
9. Verify by opening in browser: `https://namade-kadda-backend.onrender.com/api/v1/health`
   - Should return: `{"status":"ok","database":"connected","version":"1.0.0"}`

---

### Step 4: Deploy Frontend on Vercel

1. Sign in to [Vercel](https://vercel.com/) with GitHub.
2. Click **Add New...** $\to$ **Project**.
3. Import the `namade-kadda` repository.
4. Configure the project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select `frontend` *(CRITICAL: Must be `frontend`)*
5. Expand **Environment Variables** and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://namade-kadda-backend.onrender.com/api/v1` | Your Render backend URL + `/api/v1` |

> **Note**: Even if you omit `/api/v1` (e.g. `https://namade-kadda-backend.onrender.com`), our built-in `normalizeApiUrl` function in `src/lib/api.ts` automatically normalizes it.

6. Click **Deploy**.
7. Vercel will build the Next.js application in under 2 minutes and output your live production URL:
   `https://namade-kadda.vercel.app`

---

## 4. Production Verification Checklist

After deployment, perform this end-to-end sanity test on your live Vercel URL:

1. **Authentication**:
   - Go to `/login`.
   - Click "TRY DEMO ACCOUNT" $\to$ Login as **Enterprise Buyer** (`buyer@namadekadda.demo`).
   - Confirm successful redirect to `/dashboard/buyer`.
2. **AI Procurement Council**:
   - Go to `/agents`.
   - Enter `Laptop` in Component Discovery and verify CPU, RAM, Display, GPU, Motherboard cards render.
3. **Relevant Suppliers & Buyers**:
   - Check `/buyer/relevant-suppliers` for computed partner compatibility scores.
   - Switch to **Industrial Supplier** (`supplier@namadekadda.demo`) and check `/supplier/relevant-buyers`.
4. **Admin Sourcing Requests & Verification**:
   - Switch to **Admin** (`admin@namadekadda.demo`).
   - Check `/admin/sourcing-requests` to review transactions, status filters, and value summaries.
   - Check `/admin/complaints` for counterparty resolution records.
5. **Trade PDF Downloads**:
   - Open `/trade`, run a landed cost simulation, and click **Download Trade Report (PDF)**. Verify binary PDF generates cleanly.

---

## 5. Local Development Commands (PowerShell)

To run the full stack locally:

```powershell
# 1. Start Backend (Terminal 1)
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# 2. Start Frontend (Terminal 2)
cd frontend
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend API Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/v1/health`

---

## 6. Architecture & Maintenance

- **CORS Configuration**: Handled in `backend/app/main.py`. Any domain ending in `.vercel.app` is automatically permitted alongside localhost.
- **Database Seeding**: Seeded automatically on startup if the MongoDB collection `users` is empty. Existing data is never erased during server restarts or new deployments.
- **File Uploads**: Written to `backend/uploads/`. In production, attach a Render Persistent Disk mounted at `/opt/render/project/src/backend/uploads` or configure S3 / Cloudinary for permanent media retention across ephemeral reboots.
