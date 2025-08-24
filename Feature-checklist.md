

# Phase 0 — Prep (optional but helpful)

**Goal:** Baseline app ready to demo features.
**Checklist:**

* Sign in works; you can create/edit a basic task.
* Simple List view exists with Title / Status / Priority / Due.
* A “Demo Data” button loads a sample project and a few tasks.
  **Done when:** You can open the app and see demo tasks without fiddling.
  **Cursor prompt:**

> Prep for feature build: ensure login works, a basic task list is visible, and add a “Load Demo Data” action that creates a sample project with 6 tasks.

---

# Phase 1 — Natural-Language Task Capture + AI Subtasker

**Goal:** Turn a messy goal into a structured task with smart subtasks.
**User story:** “When I paste ‘Launch client site’, the tool creates a task and suggests 5–8 subtasks with priorities, due dates, and rough effort.”
**Checklist:**

* Add a big **“Add task by typing”** box at the top of the List.
* After submit, show **“Suggest subtasks”** (one click).
* Preview subtasks before saving (accept all / select some).
* Add a **“Rewrite title”** option for clarity.
  **Done when:** In one minute, you can paste a sentence → get a tidy task + suggested subtasks → accept and save.
  **Demo script:** Paste a paragraph goal; click “Suggest subtasks”; accept 6 of them; click “Rewrite title.”
  **Cursor prompt:**

> Build natural-language task capture with an “Add task by typing” box and a “Suggest subtasks” flow that previews items (title, priority, due, effort). Include a one-click “Rewrite title” action.

---

# Phase 2 — “My Day” Control Center

**Goal:** One place for today + next 7 days with quick edits and focus.
**User story:** “I open one page and can finish daily triage in under 60 seconds.”
**Checklist:**

* Add a **My Day** tab showing: Today, Tomorrow, Next 7 Days.
* Inline status/priority/due edits; quick snooze (move to tomorrow/next week).
* **Saved filters**: “Due Today”, “Overdue”, “High Priority.”
* **Command palette** from anywhere: create task, update status, jump to project.
  **Done when:** You can reprioritize today, push two tasks to tomorrow, and add a quick note—without leaving the page.
  **Demo script:** Open My Day → change two priorities → snooze one task → mark one done → open command palette and add a task to “Next 7 days.”
  **Cursor prompt:**

> Create a “My Day” view (Today/Tomorrow/Next 7 Days) with inline edits, quick snooze buttons, a few saved filters, and a global command palette for create/update/jump actions.

---

# Phase 3 — Capacity-Aware “Plan My Week”

**Goal:** Spread work across the week based on capacity; flag overloads.
**User story:** “I set my weekly capacity (e.g., 20h). The app proposes a realistic plan and highlights what won’t fit.”
**Checklist:**

* Settings: **Weekly capacity (hours)**.
* Button: **Plan My Week** → shows suggested due dates for unscheduled tasks.
* Overload indicator (e.g., “Wed +3h”) with one-click moves.
* Respect existing due dates; don’t move them automatically.
  **Done when:** Clicking “Plan My Week” fills in missing dates and highlights conflicts so you can fix them in a few clicks.
  **Demo script:** Set 10h capacity; plan; see Wed overload; move a task to Thu; accept plan.
  **Cursor prompt:**

> Add “Plan My Week”: read weekly capacity, propose due dates for unscheduled tasks, highlight overloads by day, and offer one-click moves. Keep existing due dates unchanged.

---

# Phase 4 — Project Templates & Playbooks

**Goal:** One-click project creation from a reusable template.
**User story:** “I can spin up ‘Client Onboarding’ as a ready-to-work checklist in seconds.”
**Checklist:**

* **Templates gallery** with 3 examples (e.g., Client Onboarding, Website Launch, Monthly Reporting).
* Each template has tasks, suggested estimates, and labels.
* **Use template** → creates a new project pre-filled; let me tweak before saving.
* Optional: **Save current project as template** (name + description).
  **Done when:** Creating a new project from a template takes under 5 seconds and nothing critical is missing.
  **Demo script:** Open Templates → choose “Website Launch” → generate project → edit 2 tasks → save.
  **Cursor prompt:**

> Add a Templates gallery with at least 3 templates. Support “Use template” to create a project (preview & edit before saving) and “Save as template” from any project.

---

# Phase 5 — Proactive Alerts & Daily Digest

**Goal:** Stay ahead of due-soon, stuck, and decision-needed items—without chasing.
**User story:** “Every morning I get a short summary; I’m only pinged when something really needs attention.”
**Checklist:**

* Toggle in Settings: **Daily Digest** on/off; pick channel(s): Slack / Telegram / Email.
* Digest sections: **Due Today**, **At Risk / Overdue**, **Needs Decision**, **Blocked**.
* **Idle task** rule (e.g., no activity in 7 days) → show in digest.
* Send via your **n8n webhook** (outbound JSON), not direct integrations.
  **Done when:** Toggling the digest sends a concise message with the four sections; clicking a link takes you to the task/project.
  **Demo script:** Turn on digest; mark one task blocked; trigger a test send; verify message formatting and links.
  **Cursor prompt:**

> Add a Daily Digest with sections (Due Today, At Risk/Overdue, Needs Decision, Blocked) and idle-task detection. Send to Slack/Telegram/Email via my n8n webhook. Include a “Send test now” button.



