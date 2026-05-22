# Database schema (summary)

| Table | Purpose |
| --- | --- |
| users | Profiles, roles, impact_score, soft-delete `deleted_at` |
| issues | Workplace issues, anonymity, attachments JSON, assignment |
| issue_status_history | Status transitions |
| chat_rooms | Authority vs mentor rooms (employee + participant) |
| messages | Persisted chat messages |
| public_posts | Public visibility posts + severity_score |
| post_reactions | support / like / flag |
| achievements | Contribution entries |
| mentorship_sessions | Requests and lifecycle |
| ai_suggestions | Stored AI guidance (non-authoritative) |
| notifications | User notifications |
| audit_logs | Security/audit trail |
| token_blacklist | JWT revocation |

Use Alembic for PostgreSQL migrations in production; SQLite file is used for local/academic demos.
