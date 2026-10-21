# 🚀 Adaptivly — Adaptive AI Learning & Technical Interview Platform

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start-1.168-FF4154?style=for-the-badge&logo=tanstack&logoColor=white)](https://tanstack.com/router)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white)](https://aistudio.google.com/)
[![Judge0](https://img.shields.io/badge/Judge0-Code_Execution-000000?style=for-the-badge&logo=codeforces&logoColor=white)](https://judge0.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

---

## 📌 Project Header & Overview

### Business Logic & Purpose

**Adaptivly** is an end‑to‑end, AI‑powered adaptive learning ecosystem and technical interview preparation platform. It continuously monitors user performance, error patterns, speed metrics, and topic accuracy to construct personalized learning trajectories. Powered by **Google Gemini 2.5**, **Judge0 Code Execution Engine**, **Supabase PostgreSQL**, and a **FastAPI gateway** that serves an adaptive difficulty model trained with a Random Forest classifier.

---

### ✨ Core User‑Facing Features

- 🎯 Adaptive Dashboard & Performance Heatmap – real‑time streaks, contribution heatmaps, XP levels, and Gemini‑generated learning recommendations.
- 💻 Interactive Multi‑Language Coding IDE – Monaco editor, Judge0 sandbox, runtime/memory metrics.
- 🤖 24/7 Context‑Aware Gemini CS Tutor – explain code, optimise complexity, debug errors, system‑design advice.
- 🎙️ AI Technical Mock Interviewer – multi‑turn interview sessions with automated grading.
- 📺 YouTube Video to Interactive Study Guide – transcript extraction → Gemini summary → auto‑generated quizzes.
- 🎴 SM‑2 Spaced‑Repetition Flashcards – AI‑generated cards, mastery analytics.
- 📅 Intelligent Study Planner – priority queues, deadlines, streak triggers.
- 📊 Diagnostic Assessments & Learning Paths – baseline quizzes → curriculum roadmaps.
- 🏆 Gamification & Leaderboards – XP, streak retention, achievement badges.

---

## 💻 Local Setup & Environment Guide (Cross‑Platform)

### 📋 Prerequisites
- **Node.js** ≥ 20 (v22 recommended)
- **Package manager**: `npm` ≥ 10 or **Bun** ≥ 1.1
- **Python** ≥ 3.11 (for the FastAPI service)
- **Git** (latest)
- **Supabase** account (free tier project)
- **Google Gemini API key**
- **Judge0 RapidAPI key**

### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/adaptivly-mastered.git
cd adaptivly-mastered
```

### 2️⃣ Install JavaScript/TypeScript dependencies
```bash
npm install   # or `bun install`
```

### 3️⃣ Set up the Python virtual environment and install FastAPI dependencies
#### macOS / Linux (bash/zsh)
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn joblib scikit-learn pandas datasets
```
#### Windows – **Command Prompt** (cmd)
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
pip install fastapi uvicorn joblib scikit-learn pandas datasets
```
#### Windows – **PowerShell** (bash‑like syntax)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install fastapi uvicorn joblib scikit-learn pandas datasets
```

### 4️⃣ Configure environment variables
```bash
cp .env.example .env
# Edit `.env` and fill in all required keys (Supabase, Gemini, Judge0, etc.)
```
Add the FastAPI service variables if they are not already present:
```dotenv
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
```

### 5️⃣ Initialise the Supabase database
1. Open the Supabase dashboard.
2. In **SQL Editor → New query**, run the migration files in `./supabase/migrations/` **in order** (001 → 002 → … → 005).
3. Execute `supabase/seed.sql` to load initial problems and starter code.

### 6️⃣ Get the adaptive model
A pre‑trained `adaptive_model.pkl` ships with the repo. To retrain:
```bash
python train_knowledge_tracing.py
```
The script creates/overwrites `adaptive_model.pkl` at the project root.

### 7️⃣ Start the FastAPI gateway (separate terminal)
```bash
uvicorn main:app --host $FASTAPI_HOST --port $FASTAPI_PORT
# Default URL: http://localhost:8000
```
Open `http://localhost:8000/docs` to view the Swagger UI.

### 8️⃣ Run the Adaptivly development server
```bash
npm run dev   # or `bun run dev`
```
Visit **http://localhost:3000**. The dashboard now fetches difficulty recommendations from the FastAPI service.

---

## 🚀 Production Deployment Guide (Clarified)

### Vercel (Edge‑first, serverless)
1. **Import the repository**
   - In Vercel Dashboard → **Add New → Project** → select this GitHub repo.
2. **Build settings**
   - **Framework preset**: `Other` (TanStack Start uses Nitro, not Next.js).
   - **Root directory**: `./`
   - **Build command**: `npm run build`
   - **Install command**: `npm install`
   - **Node version**: `20.x` or higher.
3. **Environment variables** (add the list below plus your existing Supabase/Gemini keys):
   ```text
   NITRO_PRESET=vercel
   DANGEROUSLY_DEPLOY_VULNERABLE_TANSTACK_START_XSS=1
   FASTAPI_HOST=0.0.0.0
   FASTAPI_PORT=8000
   ```
   The `DANGEROUSLY_DEPLOY_…` flag bypasses Vercel’s block on the TanStack Start advisory.
4. **Deploy**
   - Click **Deploy**. Vercel builds the React assets, bundles Nitro, and creates a serverless function.
   - The FastAPI endpoint is served as a separate **Python Serverless Function** (`/api/predict`). Create a `vercel.json` with a route that maps `/predict` to this function, or use a Docker deployment (see Railway) if you prefer a single container.
5. **Verify**
   - Front‑end available at `https://<project>.vercel.app`.
   - API docs at `https://<project>.vercel.app/api/predict/docs`.

### Railway (Container‑based)
1. **Create a Railway project** and link it to this GitHub repository.
2. **Add environment variables** (same as Vercel, plus `PORT=3000`).
3. **Docker build** – the repository already includes a multi‑stage `Dockerfile`. Ensure the final image runs **both** Nitro and FastAPI. Use a lightweight process manager such as `supervisord`:
   ```ini
   ; supervisord.conf placed in project root
   [program:nitro]
   command=node .output/server/index.mjs
   autorestart=true
   stdout_logfile=/dev/stdout
   stderr_logfile=/dev/stderr

   [program:fastapi]
   command=uvicorn main:app --host 0.0.0.0 --port $FASTAPI_PORT
   autorestart=true
   stdout_logfile=/dev/stdout
   stderr_logfile=/dev/stderr
   ```
   Add this file and ensure `Dockerfile`'s final `CMD` runs `supervisord -c /app/supervisord.conf`.
4. **Deploy**
   - Railway builds the Docker image, starts both services, and exposes ports `3000` (frontend) and `8000` (API).
5. **Validate**
   - Front‑end URL: `https://<app>.railway.app`
   - API Swagger UI: `https://<app>.railway.app/predict/docs`
   - Both are on the same host, so CORS is not required.

---

## 📂 Codebase Directory Map (excerpt)
```
adaptivly-mastered/
├── main.py                     # FastAPI gateway for adaptive difficulty
├── adaptive_model.pkl          # Trained Random Forest model
├── train_knowledge_tracing.py  # Synthetic data generation & training script
├── src/
│   └── server-actions/
│       └── adaptive-dashboard.ts   # Calls FastAPI & Gemini
├── README.md                  # Updated documentation (this file)
└── ... (other source files)
```

---

## 📜 License & Credits

Adaptivly is released under the MIT License. Special thanks to the open‑source communities behind React, TanStack, Supabase, FastAPI, Scikit‑Learn, and Google Gemini.
