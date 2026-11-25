# CLA TaskFlow — Frontend (PoC)

Frontend-only React prototype for the **AI-Powered Task Management & Progress
Tracking Platform** (NYP IIP, Team 9). No backend, database, real Microsoft
Graph integration or real AI — everything runs in the browser with mock data,
React Context and `localStorage`.

## Tech stack

- **React 18** + **Vite 5**
- **react-router-dom 6** for routing
- Plain CSS (no UI framework), Inter font, inline SVG icons

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`).

Other scripts:

```bash
npm run build     # production build into dist/
npm run preview   # preview the production build
```

## Demo accounts

Use the quick-login buttons on the sign-in page, or type the credentials:

| Role    | Email                     | Password     |
|---------|---------------------------|--------------|
| Staff   | hung.nguyen@cla-demo.com  | `staff123`   |
| Manager | cheryl.tan@cla-demo.com   | `manager123` |

> Demo authentication only — no real security. There is a second manager
> (`daniel.lim@cla-demo.com`) and several staff accounts in the mock data.

## Suggested demo flow

1. Log in as **Staff** → view the personalised dashboard. Click any summary
   card (e.g. *Overdue*) to jump to the task list pre-filtered.
2. Open a task. Use the **Update progress** slider and **Status** dropdown in
   the task panel — the progress bar, dashboard stats, tracker and calendar all
   update live. Use **Edit task** for full editing (title, deadline, etc.).
3. Open the **Calendar** to inspect upcoming / overdue deadlines; change a
   task's deadline and watch the calendar update.
4. Click **Simulate Incoming Task** (top bar). The AI **automatically adds** a
   new task (status *To Do*, marked **AI Detected**) — no approval needed — and
   a notification appears with the unread count increasing.
5. Click the notification to open the new task, verify/fix any highlighted
   missing details, and update its progress. Incorrect detections can be
   **dismissed** (with a confirmation).
6. Visit **Task Management & Review** to see all AI-detected tasks, filter the
   ones that *need attention*, and manage them.
7. Log out, log in as **Manager** → view team progress and the **AI Team
   Insights** widget. Click an employee's workload row or a summary card to see
   their tasks. For a task in *Pending Internal Review*, use **Approve &
   complete review** to mark it Completed.

Use **Reset Demo Data** (bottom of the sidebar) to restore the original dataset
at any time.

### Key workflow change

AI-detected tasks are now **added automatically** to the assignee's task list
with a *To Do* status and an **AI Detected** badge — there is no approval queue.
Users review, edit or dismiss them afterwards. A task at 100% progress is *not*
auto-completed if it still needs internal review; a manager confirms completion.

## Project structure

```text
frontend/
├── public/                 # favicon
├── src/
│   ├── components/         # reusable UI (Sidebar, Header, TaskCard, TaskModal,
│   │                       #   NotificationCenter, AIInsights, ProgressTracker,
│   │                       #   Calendar, ProtectedRoute, etc.)
│   ├── pages/
│   │   ├── Login/
│   │   ├── ManagerDashboard/
│   │   ├── StaffDashboard/
│   │   └── TaskReview/
│   ├── services/           # authService, taskService, aiService (all mocked)
│   ├── context/            # AuthContext, TaskContext (shared state)
│   ├── data/               # mockData.js
│   ├── hooks/              # useTaskModal
│   ├── styles/             # global.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Notes on the simulated AI

All "AI" output (task extraction, prioritisation, status suggestions, team
insights) is produced by deterministic frontend logic in `src/services/aiService.js`
over the mock task data, and is labelled as **simulated** in the UI. Status
suggestions always require user confirmation before being applied, and tasks
submitted for manager approval are never treated as confirmed until approved.
