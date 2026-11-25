# CLA TaskFlow — AI-Powered Task Management & Progress Tracking Platform

**NYP Industry Immersion Project (IIP) | Team 9**

CLA TaskFlow is designed to help CLA's audit staff and managers identify, prioritise, manage and track tasks from Microsoft Outlook and Teams.

The current proof of concept (PoC) is a React frontend that runs in the browser using mock data, React Context and localStorage. Task extraction, prioritisation, status suggestions and team insights are simulated. Backend development, database setup and live Microsoft integrations are planned.

## Run the project locally

### Frontend

Install Node.js and npm. From the repository root, run:

cd frontend
npm ci
npm run dev

Open the URL printed by Vite, usually http://localhost:5173. Use a quick-login button on the sign-in page to try the demo. Press Ctrl+C to stop the development server.

To build and preview the frontend, run these commands from the frontend folder:

npm run build
npm run preview

Vite saves the build in frontend/dist/. Open the preview URL printed in the terminal.

### Backend

The backend is planned for a later update. The current demo runs with the frontend alone. Backend setup and startup instructions will be added when it is implemented.

## Project overview

CLA's audit staff manage tasks across Outlook, Teams and other communication channels. This scatters tasks, deadlines and responsibilities, makes urgent work harder to prioritise, and requires managers to follow up manually for progress updates. It also limits visibility across audit engagements.

The proposed platform identifies actionable tasks from communications and organises them into personalised dashboards. The project goal is to reduce manual task follow-up time by at least **50%, from four hours to two hours per employee per week**, subject to PoC validation.

## Features and workflows

### Simulated task extraction and prioritisation

- Simulate an incoming task from a mock communication. The prototype adds it to the assignee's task list with a **To Do** status and an **AI Detected** badge, then displays a notification.
- Review, edit or dismiss detected tasks in **Task Management & Review**. Filter for tasks that need attention to check missing details.
- View simulated priority recommendations and adjust priorities as needed. Status suggestions require user confirmation before they are applied.
- Planned extraction capabilities include identifying task owners, deadlines and priorities from Outlook and Teams, and flagging missing information and duplicates.

### Staff dashboard

- View assigned tasks and use dashboard summary cards to open a filtered task list.
- Update progress, status, deadlines and other task details. Changes are reflected in the dashboard, progress tracker and calendar.
- Use the weekly or monthly calendar to view task deadlines and Singapore public holidays.

### Manager dashboard

- View personal tasks and authorised team members' tasks, employee workloads and simulated **AI Team Insights**.
- Monitor overdue work and potential bottlenecks. Open a workload row or summary card to view the associated tasks.
- View Singapore public holidays in the team calendar, update the manager profile photo and review the team-scoped task audit log.
- Approve tasks in **Pending Internal Review**. A task can reach 100% progress while still awaiting manager approval to be marked **Completed**.

### Progress and notifications

The task statuses are **To Do**, **In Progress**, **Pending Internal Review**, **Pending Client**, **Pending Clarification** and **Completed**. The project scope also includes task history, deadline and progress reminders, and user approval before outbound reminders are sent.

## Demo accounts

Use the quick-login buttons or enter one of these demo accounts manually.

| Role | Email | Demo password |
| --- | --- | --- |
| Staff | hung.nguyen@cla-demo.com | staff123 |
| Manager | cheryl.tan@cla-demo.com | manager123 |
These credentials are for simulated authentication. The mock data also includes a second manager, daniel.lim@cla-demo.com, and additional staff accounts.

### Suggested demo flow

1. Sign in as **Staff** and click the **Overdue** summary card to view the filtered task list.
2. Open a task and try the **Update progress** slider, **Status** dropdown and **Edit task**. Change the deadline and check where it appears in **Calendar**.
3. Click **Simulate Incoming Task** in the top bar. Open the notification, review any missing details and update the task. Use **Dismiss** if the task was detected incorrectly.
4. Open **Task Management & Review** and filter for tasks that need attention.
5. Sign in as **Manager**, open a team member's task list and use **Approve & complete review** on a task in **Pending Internal Review**.

Use **Reset Demo Data** at the bottom of the sidebar to restore the original dataset. The simulated AI output comes from deterministic logic in frontend/src/services/aiService.js.

## Technology stack

| Component | Technology | Status |
| --- | --- | --- |
| Frontend | React 18, Vite 5, JavaScript, React Router 6, plain CSS | In the PoC |
| Frontend state and storage | React Context, localStorage | In the PoC |
| Backend | Python, FastAPI | Planned |
| Database | PostgreSQL | Planned |
| Authentication | Microsoft Entra ID | Proposed |
| Outlook and Teams integration | Microsoft Graph API | Subject to CLA IT security approval |
| AI | Approved AI model | To be determined |
| Development tools | Git, GitHub, Visual Studio Code | In use |

## Project structure

```text
.
├── frontend/
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Login, dashboards and task review
│   │   ├── services/       # Mock authentication, task and AI logic
│   │   ├── context/        # Shared authentication and task state
│   │   ├── data/           # Mock data
│   │   ├── hooks/          # Custom React hooks
│   │   └── styles/         # Application styling
│   ├── package.json
│   └── vite.config.js
├── backend/                # Reserved for backend development
├── sample-data/            # Anonymised or synthetic test communications
├── docs/                   # Project planning and technical documentation
└── README.md
```


## Team responsibilities

All four members contribute to frontend and backend development.

| Member | Main responsibility | Frontend | Backend |
| --- | --- | --- | --- |
| Reanne | Authentication, audit logs and account integration | Login, profiles, account settings, role-based navigation, audit logs and access control | Authentication, permissions and account management APIs |
| Gwen | AI task extraction and approval management | Connection screens, AI task review, approval workflows, and task creation and editing | Microsoft Graph integration, task extraction, approval workflows, task APIs, database operations and notifications |
| Hung | Staff dashboard and AI task tracking | Personal dashboard, calendar, progress tracking, task filters and status updates | Personal task retrieval, progress tracking, status suggestions and task history |
| Cheryl | Manager dashboard and AI insights | Team overview, employee progress tracking and AI summaries | Team task APIs, prioritisation, team progress monitoring and AI summaries |

Shared responsibilities include database design, API integration, testing, debugging, documentation, GitHub collaboration and the final PoC demonstration.

## GitHub collaboration

| Branch | Owner or purpose |
| --- | --- |
| main | Stable shared code |
| feature/authentication | Reanne |
| feature/ai-task-extraction | Gwen |
| feature/personal-dashboard | Hung |
| feature/manager-dashboard | Cheryl |

Clone the repository, develop and test on your feature branch, then commit and push your changes. Open a pull request and request a teammate's review before merging into main.

## Security and future scope
- Use anonymised or synthetic communications for development. Keep confidential client data, real passwords and API keys out of GitHub.
- Apply role-based and engagement-level permissions when implementing backend access.
- Use approved, preferably read-only access for live communications. Outlook and Teams integration requires CLA IT security approval.
- Require human confirmation before applying suggested status changes or sending outbound reminders.

Future enhancements include live Outlook and Teams integration, progress updates based on communications, Outlook Calendar synchronisation and advanced workload analytics.

*This educational proof of concept requires CLA approval before production use.*
