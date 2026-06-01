# Socratix Progress

## Completed

### Auth
- Register, login, JWT (`/auth/register`, `/auth/login`, `GET /auth/me`)
- Real user directory: `GET /users` (JWT) for Messages peer list
- Profile edit: `PUT /auth/me` (name, department, bio — not email, password, or role)
- Avatar upload: `POST /auth/me/avatar`, `DELETE /auth/me/avatar`; files in `uploads/avatars/`; served at `/uploads/...`

### Ideas
- Create, read, update, delete via API (`ideas` table)
- Owner permissions: `PUT` / `DELETE /ideas/{id}` only for the idea author (JWT)
- Status model: **`draft` (owner-only)** | **`submitted` (public)** — new ideas start as `draft`; after AI Review (answers or skip) they become `submitted`. Legacy statuses (e.g. `devils_advocate`) are normalized to `submitted` on read
- Draft privacy (server-side): `GET /ideas` (JWT) returns all submitted ideas plus only the caller’s drafts; `GET /ideas/{id}` returns 403 when a non-owner requests another user’s draft
- Submitted workflow: `/devil/:id` → `POST /ideas/{id}/devil-questions`, `POST /ideas/{id}/devil` sets `submitted` and `aiReviewed` / `devilSkipped` as appropriate
- UI badges: Draft / Submitted, plus **AI Reviewed** when `aiReviewed` is true (not shown for drafts)
- Vote / unvote: `POST /ideas/{id}/vote` (JWT toggle); voters stored as `{ id, name }` on the idea
- Comments: stored on each idea in the database (`ideas.comments` JSONB); add via `POST /ideas/{id}/comments`; view on idea detail from API-loaded idea data

### AI
- AI Improve: `POST /ideas/ai-improve` (JWT)
- AI Review questions: `POST /ideas/{id}/devil-questions` (JWT)
- Risk/analysis panel: `POST /ideas/{id}/devil-advocate` (internal API route name; UI label **AI Analysis**, not “Devil’s Advocate”)
- OpenAI when `OPENAI_API_KEY` is set; safe JSON fallbacks when the key is missing or the call fails

### Messaging
- Real user-to-user messages (`messages` table): `GET /messages/users`, `GET /messages/{user_id}`, `POST /messages` (JWT)

### Frontend
- Pages wired to the FastAPI backend (no mock auth or mock voter personas)
- i18n: `frontend/src/i18n/en.json`, `tr.json`; `useTranslation()`; language preference in `localStorage`
- Profile edit + avatar file upload; notification toggles per user in `localStorage`
- `mockData.js` used only for category/department picklists (not users, votes, or profile)

### Tests
- Backend pytest: `test_ai_improve`, `test_devil_advocate`, `test_devil_flow`, `test_draft_privacy`, `test_idea_ownership`, `test_messages`, `test_vote_toggle`, `test_profile_update`, `test_avatar_upload`

## Not implemented (yet)

- Password reset: `PasswordResetToken` model exists for schema creation, but there are no `POST /auth/forgot-password` / reset endpoints on the backend (Forgot Password UI is not fully wired)

## Notes

- Set `OPENAI_API_KEY` in `backend/.env` (see `.env.example`). Never commit `.env`.
- Restart uvicorn after backend changes so `/uploads` static files and DB column migrations apply.
