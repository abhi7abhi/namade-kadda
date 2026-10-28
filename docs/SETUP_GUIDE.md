# Namade Kadda - Windows Student Setup & Execution Guide

This guide provides exact, tested PowerShell commands to set up, initialize, test, and run the Namade Kadda B2B Marketplace prototype on Windows.

---

## 1. Prerequisites
- **Python**: 3.10 to 3.14 (Verified working on Python 3.14)
- **Node.js**: v18 or later (Verified working on Node v24.13)
- **PowerShell**: Windows 10/11 built-in

---

## 2. Directory Structure
```text
namade-kadda/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # FastAPI endpoints (suppliers, sourcing, rfqs, quotes, orders, bom, trade, agents, analytics)
│   │   ├── core/           # Database engine & environment config
│   │   ├── models/         # SQLAlchemy relational database models
│   │   ├── schemas/        # Pydantic v2 validation models
│   │   ├── services/       # Business logic services
│   │   ├── agents/         # 6 specialist AI agents & orchestrator
│   │   └── seed/           # Synthetic dataset seeder
│   ├── alembic/            # Database migration scripts
│   ├── tests/              # Automated pytest suite
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router pages (all 10 primary pages)
│   │   ├── components/     # Reusable UI components (Sidebar, Header, Banner)
│   │   └── lib/            # Typed API client
│   ├── package.json
│   └── .env.local
└── docs/                   # Architecture, API docs, and feature matrices
```

---

## 3. Backend Setup & Run

### Step A: Open PowerShell Terminal #1 (Backend)
Navigate to the backend directory:
```powershell
cd "C:\Users\abhin\.gemini\antigravity\scratch\namade-kadda\backend"
```

### Step B: Install Python Dependencies
```powershell
python -m pip install -r requirements.txt
```

### Step C: Configure Environment
Copy the `.env.example` file to `.env`:
```powershell
Copy-Item .env.example .env -Force
```
*(By default, `DATABASE_URL` is configured for SQLite zero-friction execution. To connect PostgreSQL, set `DATABASE_URL="postgresql+psycopg2://postgres:password@localhost:5432/namade_kadda"`)*

### Step D: Initialize Database & Run Alembic Migrations
```powershell
alembic upgrade head
python -m app.seed.seed_data
```

### Step E: Run Backend Automated Test Suite
```powershell
python -m pytest tests/test_api.py -v
```

### Step F: Launch the FastAPI Backend Server
```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at:
- **Interactive Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc API Spec**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Endpoint**: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

---

## 4. Frontend Setup & Run

### Step A: Open PowerShell Terminal #2 (Frontend)
Navigate to the frontend directory:
```powershell
cd "C:\Users\abhin\.gemini\antigravity\scratch\namade-kadda\frontend"
```

### Step B: Install Dependencies
```powershell
npm install
```

### Step C: Launch Next.js Development Server
```powershell
npm run dev
```
Open your browser at:
- **Application Dashboard**: [http://localhost:3000](http://localhost:3000)

---

## 5. Primary Application Routes
- **Overview Dashboard**: `http://localhost:3000/`
- **Supplier Directory**: `http://localhost:3000/suppliers`
- **Natural Language Sourcing**: `http://localhost:3000/sourcing`
- **Quotation Matrix & RFQs**: `http://localhost:3000/quotations`
- **Order Lifecycle & Tracking**: `http://localhost:3000/orders`
- **AI Procurement Workspace**: `http://localhost:3000/agents`
- **Engineering / BOM**: `http://localhost:3000/bom`
- **Trade & Customs**: `http://localhost:3000/trade`
- **Analytics & Charts**: `http://localhost:3000/analytics`
- **Settings & RBAC**: `http://localhost:3000/settings`
