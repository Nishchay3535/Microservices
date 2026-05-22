# Health Equity & Gender-Sensitive Mentoring Network

Monorepo: **Next.js 14 + TypeScript** frontend (brand pink `#FF55B8` on white) and **FastAPI** backend with **async SQLAlchemy**, **JWT + token blacklist**, **audit logs**, **WebSocket chat**, **public board**, **GDPR-style deletion**, and optional **Supabase / OpenAI / Resend** integrations.

## Quick start (local)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy ..\.env.example .env   # then edit backend/.env if needed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Seed demo users (password `demo12345`):

```bash
python scripts/seed_demo_users.py
```

Demo accounts: `authority@demo.local`, `mentor@demo.local`, `admin@demo.local`.

API base: `http://127.0.0.1:8000/api/v1` · OpenAPI: `http://127.0.0.1:8000/docs` · Health: `http://127.0.0.1:8000/health`.

### Frontend

```bash
cd frontend
copy ..\.env.example .env.local   # set NEXT_PUBLIC_API_URL
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tests

```bash
cd backend
pytest tests/ -v
```

## Docker Compose

```bash
docker compose up --build
```

## Kubernetes

See [`k8s/`](k8s/) for Namespace, Deployment, Service, Ingress, ConfigMap, Secret template, and HPA. Replace image registry and TLS secrets before applying.

## Docs

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/api-spec.md`](docs/api-spec.md)
- [`docs/database-schema.md`](docs/database-schema.md)

## Notes

- AI suggestions use OpenAI when `OPENAI_API_KEY` is set; otherwise a safe heuristic fallback is used.
- Email uses Resend when `RESEND_API_KEY` is set; otherwise emails are logged (dev mock).
- WebSocket URL is derived from `NEXT_PUBLIC_API_URL` (same host, `/ws/chat/{room_id}?token=...`).
