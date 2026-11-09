# CLINOVA — Installation & Local Deployment Guide

## 1. Prerequisites

- **Python:** 3.10+ (tested on Python 3.13)
- **Node.js:** v18+ (tested on Node.js v26)
- **Package Manager:** npm / yarn / pnpm

---

## 2. Quickstart Execution

### Step 1: Clone & Inspect Workspace
```bash
cd /path/to/CliNova
```

### Step 2: Install Frontend Dependencies
```bash
npm install
```

### Step 3: Initialize Database & Seed Authentic Healthcare Cohort
```bash
python3 -c "from backend.database.session import init_db; init_db(); print('CLINOVA Database initialized successfully.')"
```

### Step 4: Run Backend Test Suite
```bash
python3 -m unittest discover -s backend/tests -v
```

### Step 5: Start the Development Servers

#### Terminal A: Start Flask Backend Server (Port 5001)
```bash
python3 backend/main.py
```
*Backend runs on `http://127.0.0.1:5001` with API root `/api`.*

#### Terminal B: Start React Vite Frontend Server (Port 3000)
```bash
npm run dev
```
*Open your browser at `http://localhost:3000` to interact with CLINOVA.*

---

## 3. Production Build

To compile the production-ready frontend bundle:
```bash
npm run build
```
The compiled assets will be placed in `dist/` with optimized chunking and minification.

