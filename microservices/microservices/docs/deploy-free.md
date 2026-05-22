# Free hosting plan (~1 week to 1 month)

Deploy **frontend** and **backend** separately (standard for this stack). Total cost: **$0** on free tiers if you stay within limits.

| Part | Service | Free tier notes |
|------|---------|-----------------|
| Next.js frontend | [Vercel](https://vercel.com) | Hobby plan, good for Next.js |
| FastAPI backend | [Render](https://render.com) | Free web service; sleeps after ~15 min idle (first load slow) |
| Database | [Neon](https://neon.tech) | Free PostgreSQL (avoid SQLite on Render — data can be lost on redeploy) |
| AI (Groq) | [Groq Console](https://console.groq.com) | Same keys you use locally |

**I cannot deploy for you** — you must sign in to these sites and connect your GitHub repo. This guide is the exact sequence.

---

## Before you start (30 minutes)

1. **Push your code to GitHub** (private or public repo).
   - Do **not** commit `backend/.env` or secrets. Only commit `.env.example`.
2. Generate a production secret (PowerShell or Git Bash):
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
   Save the output — you will use it as `SECRET_KEY` on Render.
3. Have ready: Groq API key, Neon database URL (step 2 below).

---

## Step 1 — Database (Neon, ~5 min)

1. Go to https://neon.tech → Sign up → **New project**.
2. Copy the connection string. It looks like:
   `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
3. Convert it for this app (add `+asyncpg` after `postgresql`):
   ```text
   postgresql+asyncpg://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
   This is your **`DATABASE_URL`** for Render.

---

## Step 2 — Backend (Render, ~15 min)

1. Go to https://dashboard.render.com → **New +** → **Web Service**.
2. Connect your **GitHub** repo.
3. Settings:
   | Field | Value |
   |-------|--------|
   | **Root Directory** | `microservices/microservices/backend` |
   | **Runtime** | **Docker** |
   | **Dockerfile Path** | `Dockerfile` |
   | **Instance type** | **Free** |
   | **Health Check Path** | `/health` |

4. **Environment variables** (Render → Environment):

   | Key | Value |
   |-----|--------|
   | `SECRET_KEY` | (your generated hex from above) |
   | `DATABASE_URL` | Neon URL with `postgresql+asyncpg://...` |
   | `CORS_ORIGINS` | `https://YOUR-APP.vercel.app` (fill after Step 3, or use `*` temporarily for testing only) |
   | `FRONTEND_URL` | `https://YOUR-APP.vercel.app` |
   | `OPENAI_API_KEY` | Your Groq key (`gsk_...`) |
   | `OPENAI_BASE_URL` | `https://api.groq.com/openai/v1` |
   | `AI_MODEL` | `llama-3.1-8b-instant` |

5. Click **Create Web Service**. Wait until deploy is **Live**.
6. Copy your backend URL, e.g. `https://healthequity-api.onrender.com`.
7. Open `https://YOUR-BACKEND.onrender.com/health` — should return `{"status":"ok"}`.
8. **Seed demo users** (one time): Render → **Shell** (or run locally against Neon URL):
   ```bash
   cd backend
   pip install -r requirements.txt
   # set DATABASE_URL to Neon URL in shell, then:
   python scripts/seed_demo_users.py
   ```

---

## Step 3 — Frontend (Vercel, ~10 min)

1. Go to https://vercel.com → **Add New Project** → import the same GitHub repo.
2. Settings:
   | Field | Value |
   |-------|--------|
   | **Root Directory** | `microservices/microservices/frontend` |
   | **Framework** | Next.js (auto-detected) |

3. **Environment variable**:

   | Key | Value |
   |-----|--------|
   | `NEXT_PUBLIC_API_URL` | `https://YOUR-BACKEND.onrender.com/api/v1` |

4. Deploy. Copy your Vercel URL, e.g. `https://your-app.vercel.app`.

---

## Step 4 — Link frontend and backend (CORS)

1. Render → your web service → **Environment**:
   - `CORS_ORIGINS` = `https://your-app.vercel.app`
   - `FRONTEND_URL` = `https://your-app.vercel.app`
2. **Save** and wait for redeploy (~2 min).
3. Redeploy Vercel if you changed env (usually not needed for CORS-only backend change).

---

## Step 5 — Test

1. Open your Vercel URL.
2. Log in with demo user (if seeded): `authority@demo.local` / `demo12345`.
3. Open AI chat — should use Groq via backend env vars.

---

## Limits you should know

| Topic | What to expect |
|-------|----------------|
| **Render free sleep** | After ~15 min no traffic, API wakes in 30–60 s on first request |
| **Neon free** | Storage/CPU caps; fine for demos |
| **Vercel hobby** | Bandwidth limits; fine for class/demo |
| **WebSockets** | May be flaky on free Render; REST/chat AI should still work |
| **1 month** | Free tiers are ongoing but providers can change policies; no guarantee forever |

---

## If Render asks for a credit card

Some accounts require a card for verification; free tier should not charge if you select **Free** instance. Alternative backends: **Fly.io**, **Railway** (trial credits).

---

## Quick checklist

- [ ] Code on GitHub (no `.env` in repo)
- [ ] Neon `DATABASE_URL` with `postgresql+asyncpg://`
- [ ] Render backend live, `/health` OK
- [ ] Demo users seeded
- [ ] Vercel `NEXT_PUBLIC_API_URL` points to Render `/api/v1`
- [ ] `CORS_ORIGINS` includes Vercel URL
- [ ] Groq key set on Render only (not in frontend)

---

## Repo paths (this copy of the project)

If your GitHub repo root is the folder that contains `backend` and `frontend`:

- Backend root: `backend`
- Frontend root: `frontend`

Render **Root Directory**: `microservices/microservices/backend`  
Vercel **Root Directory**: `microservices/microservices/frontend`
