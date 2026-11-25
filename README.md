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

.
├── frontend/
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable UI
│   │   ├── pages/          # Login, dashboards and task review
│   │   ├── services/       # Mock authentication, task and AI logic
│   │   ├── context/        # Shared authentication and task state
│   │   ├── data/           # Mock data
│   │   ├── hooks/
│   │   └── styles/
│   ├── package.json
│   └── vite.config.js
├── backend/                # Reserved for backend development
├── sample-data/            # Anonymised or synthetic test communications
├── docs/                   # Project planning and technical documentation
└── README.md

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