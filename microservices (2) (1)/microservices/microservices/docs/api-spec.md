# API overview

Base path: `/api/v1`

Key groups:

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, password reset routes
- `GET/PUT /users/me`, `GET /users/mentors`, `GET /users/authorities`
- `POST /issues`, `GET /issues`, `GET /issues/{id}`, `PUT /issues/{id}/status`, `POST /issues/upload-attachment`
- `POST /chat/rooms` — ensure authority/mentor room
- `GET/POST /public-posts`, `POST /public-posts/{id}/react`
- `GET/POST /achievements`, `POST /achievements/{id}/verify`
- `POST /mentorship/request`, `GET /mentorship/sessions`, `PUT /mentorship/sessions/{id}`
- `GET /notifications`, `PUT /notifications/{id}/read`
- `GET /ai/suggestions/{issue_id}`
- `GET/PUT /admin/*`, `GET /admin/audit-logs`
- `DELETE /gdpr/me`, `DELETE /gdpr/me/hard`

WebSocket: `GET ws://host/ws/chat/{room_id}?token=JWT`

Full interactive schema: run backend and open `/docs`.
