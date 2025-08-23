
# TaskSmith — Build Plan (Cursor × Supabase × OpenAI × n8n)

This `TASKS.md` guides Cursor through a reliable, **phased** build. Keep prompts short; commit after each phase.

**Stack**
- Next.js 14 (App Router, TypeScript), Tailwind, shadcn/ui, lucide-react
- TanStack Query, react-hook-form, zod
- Supabase (Google auth, Postgres, Storage, Realtime, RLS)
- OpenAI (client-side for DEV ONLY), n8n via outbound webhooks
- **No Google Calendar** (we’ll use n8n for Google stuff later)

> ⚠️ **Security**: Using OpenAI API key on the client is for DEV only. Add a banner warning and plan a server proxy before prod.

---

## Phase 1 — Scaffold & Dependencies ✅

**Goal**: App shell, auth, routing, theming.

**Checklist**
- [ ] Initialize Next.js 14 (App Router, TS) + Tailwind
- [ ] Install deps: `@supabase/supabase-js @tanstack/react-query react-hook-form zod @hookform/resolvers class-variance-authority lucide-react cmdk date-fns`
- [ ] Install & init **shadcn/ui**; add Button, Input, Dialog, Sheet, Tabs, Table, Command, Switch
- [ ] `.env.local` placeholders: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_OPENAI_API_KEY` (DEV ONLY)
- [ ] Supabase client (`lib/supabaseClient.ts`)
- [ ] **Google Auth** (single user) using Supabase
- [ ] App shell: sidebar (Projects, Labels, Saved Filters, Settings), top bar (Cmd/Ctrl+K palette, theme toggle, avatar)
- [ ] Pages: `/` (tabs: **List**, **My Tasks**, **Saved Filters**), `/settings`
- [ ] **DEV-ONLY banner** if OpenAI key exists

**Cursor prompt**
> Initialize scaffold & deps above, wire Google auth with Supabase, create the app shell + pages, and commit as “chore(scaffold): nextjs+supabase shell with auth & ui”.

---

## Phase 2 — Database Schema + RLS + Storage ✅

**Goal**: SQL schema, RLS policies, private Storage bucket.

**Tables**
- `projects`
- `tasks` (enums: `task_status( backlog|in_progress|done )`, `task_priority( low|med|high|urgent )`)
- `subtasks`, `labels`, `task_labels`, `comments`, `attachments`
- `task_dependencies` (task → task)
- `settings` (weekly capacity, webhooks, AI caps)
- Optional `profiles`

**Owner model**: single owner → `owner_id = auth.uid()` on all rows.

**Checklist**
- [ ] Create `supabase/schema.sql` with tables, enums, indexes
- [ ] Enable **RLS** on all tables; policies: owner-only read/write
- [ ] Create private bucket **`attachments`**; upload path: `attachments/{owner_id}/{uuid}-{filename}`
- [ ] Seed script `scripts/seed.ts` with demo data (2 projects, 6 tasks, 8 subtasks, labels, comments)
- [ ] Typed CRUD helpers & RT subscriptions for `tasks`, `subtasks`, `comments`

**Cursor prompt**
> Generate schema.sql + RLS + storage notes & a seed script. Add typed helpers and realtime wiring. Commit as “feat(db): schema+rls+storage+seed”.

---

## Phase 3 — UI: List View & Task Drawer ✅

**Goal**: Productive task UI with inline edits, DnD, realtime.

**Checklist**
- [ ] **List View** table: Title, Project, Status, Priority, Due, Estimate, Labels
- [ ] Inline edit: status/priority/due/labels (optimistic updates)
- [ ] **Drag/drop** reorder (writes `order_index` within current filter)
- [ ] **Task Drawer**: description, comments, subtasks, attachments, labels
- [ ] Realtime patches cache on task/subtask/comment changes
- [ ] **Saved Filters** (localStorage for MVP)
- [ ] **Global search / Command palette** (cmdk): quick create, set status/priority, jump to project

**Cursor prompt**
> Build List view + Task Drawer with inline edit, DnD order_index, realtime cache patches, saved filters, and a command palette. Commit as “feat(ui): list+drawer with inline edit, dnd, realtime”.

---

## Phase 4 — AI Tools (Client-side DEV) ✅

**Goal**: AI assists for subtasking, summaries, scheduling.

**Checklist**
- [ ] `lib/ai.ts` → `aiCall({ purpose, prompt, schema, maxTokens })` with per-day budget + token caps (from `settings`)
- [ ] **zod schemas** for structured outputs; show diffs before applying
- [ ] **Admin-only AI** (only owner sees AI buttons)
- [ ] Actions:
  - [ ] **Generate Subtasks** → returns `[ { title, estimate_hours(0.25–8), suggested_priority, suggested_due_date|null } ]`
  - [ ] **Estimate Effort / Suggest Due & Priority** (single task)
  - [ ] **Rewrite Title** (≤70 chars, action-verb first)
  - [ ] **Summarize Thread** (3–5 bullets, decisions & owners)
  - [ ] **Extract Action Items** (new subtasks from comments)
  - [ ] **Auto-Schedule** (capacity-aware; does **not** change existing due dates)
  - [ ] **Detect Blockers** (unmet dependencies)
- [ ] **DEV banner** reminding client-side keys are not for prod

**Cursor prompt**
> Implement ai.ts + zod-validated tools above. Add UI actions and apply changes safely. Commit as “feat(ai): subtasking, summaries, scheduler (dev-only)”.

---

## Phase 5 — Notifications & n8n Webhooks ✅

**Goal**: External notifications without a backend.

**Checklist**
- [ ] Settings fields: `notify_email`, `notify_slack_webhook`, `notify_telegram_webhook`, `weekly_capacity_hours`, `ai_max_tokens`, `ai_daily_budget_usd`
- [ ] Client event bus: on `task.created|updated|assigned|due_soon` → POST JSON to configured webhook URLs
- [ ] **n8n Recipe 1 (Slack)** — Webhook → IF `event.type == "task.assigned"` → Slack post
- [ ] **n8n Recipe 2 (Telegram)** — Webhook → IF `event.type == "task.due_soon"` (≤48h) → Telegram message
- [ ] README: paste recipe JSONs + mapping guide

**Cursor prompt**
> Add settings + webhook sender + include two example n8n recipes in README. Commit as “feat(notify): webhook bus + n8n recipes”.

---

## Acceptance Criteria

- [ ] Google sign-in works; data is scoped to the owner via **RLS**
- [ ] Create/edit tasks inline; **DnD** reorder persists order_index
- [ ] Drawer shows comments, subtasks, labels, attachments (Storage private)
- [ ] Realtime updates reflect across tabs
- [ ] Command palette & global search operational
- [ ] AI: Generate Subtasks works with validated JSON; other tools run with guardrails
- [ ] Webhook events hit n8n endpoints (Slack/Telegram) with correct payload
- [ ] Clear **DEV ONLY** notice for client-side OpenAI key

---

## Quick Runbook

**Environment**
```
cp .env.local.example .env.local
# Fill:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# NEXT_PUBLIC_OPENAI_API_KEY=... (DEV ONLY)
```

**Create project**
```
npx create-next-app@latest tasksmith --ts --eslint --tailwind --app --src-dir --import-alias "@/*"
cd tasksmith
npx shadcn-ui@latest init
```

**Install deps**
```
npm i @supabase/supabase-js @tanstack/react-query react-hook-form zod @hookform/resolvers class-variance-authority lucide-react cmdk date-fns
```

**Dev server**
```
npm run dev
```

**Supabase:**
- Create the **attachments** bucket (private).  
- Run `schema.sql` in the SQL editor.  
- Enable RLS and add policies as defined.  
- Run `scripts/seed.ts` to insert demo data.

---

## Troubleshooting

- **401 / empty queries** → RLS not configured or `owner_id` not set on insert
- **Realtime not firing** → row filters or channel not subscribed correctly
- **File access denied** → Storage policy path mismatch (ensure `attachments/{owner_id}/…`)
- **AI errors** → exceed token/budget caps or client key missing; check banner and settings
- **Webhook timeouts** → n8n URL not reachable from client; test via a public webhook first

---

## Out of Scope (MVP)

- Google Calendar sync (use n8n later)
- Multi-tenant workspaces/teams
- Server-side AI proxy (recommended before production)
