# Architecture

- **Client:** Next.js App Router, Zustand persisted auth, Axios API client, native WebSocket for chat.
- **API:** FastAPI with `/api/v1` REST prefix; modular `routes`, `services`, `models`, `schemas`.
- **Auth:** JWT with `jti`; logout inserts into `token_blacklist`. Password reset uses signed JWT email link.
- **Data:** Async SQLAlchemy; SQLite by default, PostgreSQL via `DATABASE_URL`. Tables cover issues, chat rooms/messages, public posts/reactions, achievements, mentorship, AI suggestions, notifications, audit logs.
- **Observability:** `audit_logs` append-only records for sensitive actions.
- **Deploy:** Docker image for API; optional Redis for rate limiting; Kubernetes manifests for scaled API pods.
