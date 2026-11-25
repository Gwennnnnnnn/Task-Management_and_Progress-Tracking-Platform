# CLA TaskFlow — AI-Powered Task Management & Progress Tracking Platform

**NYP Industry Immersion Project (IIP) | Team 9**

CLA TaskFlow is designed to help CLA's audit staff and managers identify, prioritise, manage and track tasks from Microsoft Outlook and Teams.

The current proof of concept (PoC) is a React frontend that runs in the browser using mock data, React Context and localStorage. Task extraction, prioritisation, status suggestions and team insights are simulated.

Backend development, database setup and live Microsoft integrations are planned.

---

## Table of contents

- [Run the project locally](#run-the-project-locally)
- [Project overview](#project-overview)
- [Features and workflows](#features-and-workflows)
- [Demo accounts](#demo-accounts)
- [Suggested demo flow](#suggested-demo-flow)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Team responsibilities](#team-responsibilities)
- [GitHub collaboration](#github-collaboration)
- [Security and future scope](#security-and-future-scope)

---

## Run the project locally

### Prerequisites

Ensure the following tools are installed:

- [Node.js and npm](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/)

### Frontend

Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/Gwennnnnnn/Task-Management_and_Progress-Tracking-Platform.git
cd Task-Management_and_Progress-Tracking-Platform
```

From the repository root, install the frontend dependencies:

```bash
cd frontend
npm ci
```

Start the development server:

```bash
npm run dev
```

Open the URL printed by Vite, usually:

[http://localhost:5173](http://localhost:5173)

Use a quick-login button on the sign-in page to try the demo.

Press `Ctrl + C` in the terminal to stop the development server.

For subsequent sessions, run the following commands from the repository root:

```bash
cd frontend
npm run dev
```

### Production build

To build and preview the frontend, run these commands from the `frontend` directory:

```bash
npm run build
npm run preview
```

Vite saves the production build in `frontend/dist/`. Open the preview URL printed in the terminal.

### Backend

The backend is planned for a later update. The current demo runs with the frontend alone.

Backend setup, database configuration and startup instructions will be added when the backend is implemented.

---

## Project overview

CLA's audit staff manage tasks across Outlook, Teams and other communication channels. This scatters tasks, deadlines and responsibilities, makes urgent work harder to prioritise, and requires managers to follow up manually for progress updates.

It also limits visibility across audit engagements and makes it difficult to monitor employee workloads effectively.

The proposed platform identifies actionable tasks from communications and organises them into personalised dashboards, providing a centralised platform for task management and progress tracking.

### Project objectives

- Reduce manual task extraction from emails and messages.
- Improve task visibility and prioritisation.
- Centralise task management and progress tracking.
- Provide managers with better visibility of employee workloads.
- Reduce manual follow-ups and administrative work.
- Support informed decision-making through AI-assisted recommendations.

The project goal is to reduce manual task follow-up time by at least **50%, from four hours to two hours per employee per week**, subject to PoC validation.

---

## Features and workflows

### AI task extraction and prioritisation

- Simulate incoming tasks from mock communications.
- Automatically add detected tasks to the assigned employee's task list.
- Identify newly detected tasks using an appropriate badge or indicator.
- Notify users when new tasks are detected.
- Allow users to review, edit or dismiss incorrectly detected tasks.
- Flag tasks with missing information that require further attention.
- Provide simulated AI-assisted priority recommendations.
- Allow users to review and adjust recommended priorities.
- Require user confirmation before applying AI-generated status suggestions.

Planned extraction capabilities include identifying task owners, deadlines and priorities from Microsoft Outlook and Teams, as well as flagging missing information and duplicate tasks.

### Staff dashboard

- View personalised task summaries and assigned tasks.
- Access filtered task lists through dashboard summary cards.
- Monitor upcoming deadlines and overdue tasks.
- Review AI-assisted task prioritisation.
- View personal task breakdowns and progress summaries.
- Create, review and edit task details.
- Manage tasks through a centralised task management interface.
- View task deadlines and Singapore public holidays through weekly and monthly calendar views.

### Manager dashboard

- View personal tasks and authorised team members' tasks.
- Monitor employee workloads and task completion.
- Identify overdue tasks and potential bottlenecks.
- Access simulated AI Team Insights.
- View individual employee task breakdowns.
- Access relevant tasks through workload rows and dashboard summary cards.
- Review tasks requiring internal approval.
- View Singapore public holidays in the team calendar.
- Update the manager profile photo.
- Review the team-scoped task audit log.

### Task management and Kanban workflow

The intended Kanban workflow organises tasks into three main statuses:

| Status | Description |
| --- | --- |
| To Do | Tasks that have not been started |
| In Progress | Tasks that are currently being worked on |
| Completed | Tasks that have been completed |

The intended workflow allows users to update task statuses by dragging and dropping task cards between Kanban columns.

Task progress is intended to update automatically according to the task's status, reducing the need for manual progress updates.

Tasks requiring additional review may remain under **In Progress** with indicators such as:

- Pending Internal Review
- Pending Client Review

These indicators provide additional context without creating separate main Kanban columns.

### Task review and approval

- Review newly detected tasks before proceeding.
- Edit task titles, descriptions, priorities and deadlines.
- Record additional task information and review requirements.
- Allow managers to review tasks requiring internal approval.
- Maintain human oversight over AI-generated recommendations.
- Prevent AI suggestions from being applied without user confirmation.

### Calendar and progress tracking

- Display task deadlines in weekly and monthly calendar views.
- Include Singapore public holidays.
- Reflect task updates across dashboards and calendar views.
- Provide visual indicators of task completion and progress.
- Help employees and managers monitor upcoming deadlines.

### Notifications and reminders

- Notify users of newly detected tasks.
- Provide access to relevant task details through notifications.
- Highlight tasks requiring attention.
- Support planned deadline and progress reminders.
- Require user approval before sending outbound reminders.

### Audit logs and account management

- Support simulated role-based authentication.
- Provide separate staff and manager interfaces.
- Allow users to manage profile information.
- Provide authorised managers with access to team-scoped audit logs.

---

## Demo accounts

Use the quick-login buttons on the sign-in page or enter one of the following demo accounts manually.

| Role | Email | Demo password |
| --- | --- | --- |
| Staff | `hung.nguyen@cla-demo.com` | `staff123` |
| Manager | `cheryl.tan@cla-demo.com` | `manager123` |

These credentials are for simulated authentication and demonstration purposes only.

The mock dataset also includes a second manager, `daniel.lim@cla-demo.com`, and additional staff accounts.

No real CLA employee credentials or confidential client information should be used in the PoC.

---

## Suggested demo flow

### Staff demonstration

1. Sign in using the **Staff** demo account.
2. Review the personalised dashboard and task summary cards.
3. Click the **Overdue** summary card to view overdue tasks.
4. Review the AI-assisted task prioritisation and personal task breakdown.
5. Open a task and review its details.
6. Edit the task's deadline or other relevant information.
7. Check where the updated task appears in the calendar.
8. Click **Simulate Incoming Task** in the top navigation bar.
9. Open the notification and review the newly detected task.
10. Update any missing information or dismiss the task if it was detected incorrectly.
11. Demonstrate the available task status and progress management controls.

### Manager demonstration

1. Sign in using the **Manager** demo account.
2. Review the manager dashboard and team overview.
3. View employee workloads and AI Team Insights.
4. Identify overdue tasks and potential bottlenecks.
5. Open a team member's task list.
6. Review tasks requiring internal approval.
7. Demonstrate the available approval workflow.
8. Simulate an incoming task assigned to the manager.
9. Review the manager's personal task prioritisation and task breakdown.
10. Open the team-scoped audit log.

### Reset demo data

Use **Reset Demo Data** at the bottom of the sidebar to restore the original mock dataset.

The simulated AI output comes from deterministic logic in:

`frontend/src/services/aiService.js`

---

## Technology stack

| Component | Technology | Status |
| --- | --- | --- |
| Frontend | React 18, Vite 5, JavaScript | In the PoC |
| Routing | React Router 6 | In the PoC |
| User interface | Plain CSS | In the PoC |
| State management | React Context | In the PoC |
| Local storage | Browser localStorage | In the PoC |
| Backend | Python, FastAPI | Planned |
| Database | PostgreSQL | Planned |
| Authentication | Microsoft Entra ID | Proposed |
| Outlook and Teams integration | Microsoft Graph API | Subject to CLA IT security approval |
| AI integration | Approved AI model | To be determined |
| Version control | Git and GitHub | In use |
| Development environment | Visual Studio Code | In use |

---

## Project structure

```text
.
├── frontend/
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Shared authentication and task state
│   │   ├── data/           # Mock data
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Login, dashboards and task management
│   │   ├── services/       # Mock authentication, task and AI logic
│   │   ├── styles/         # Application styling
│   │   ├── App.jsx         # Main application component
│   │   └── main.jsx        # Application entry point
│   ├── .gitignore          # Frontend Git exclusions
│   ├── index.html          # HTML entry point
│   ├── package-lock.json   # Locked dependency versions
│   ├── package.json        # Dependencies and scripts
│   └── vite.config.js      # Vite configuration
├── backend/                # Reserved for backend development
├── .gitignore              # Repository Git exclusions
└── README.md               # Project documentation
```

The `node_modules/` and `dist/` directories are generated locally and should not be committed to the repository.

---

## Team responsibilities

All four team members contribute to frontend and backend development.

| Member | Main responsibility | Frontend | Backend |
| --- | --- | --- | --- |
| Reanne | Authentication, audit logs and account integration | Login, profiles, account settings, role-based navigation, audit logs and access control | Authentication, permissions and account management APIs |
| Gwen | AI task extraction and approval management | Connection screens, AI task review, approval workflows, task creation and editing | Microsoft Graph integration, task extraction, approval workflows, task APIs, database operations and notifications |
| Hung | Staff dashboard and AI task tracking | Personal dashboard, calendar, progress tracking, task filters and status updates | Personal task retrieval, progress tracking, status suggestions and task history |
| Cheryl | Manager dashboard and AI insights | Team overview, employee progress tracking and AI summaries | Team task APIs, prioritisation, team progress monitoring and AI summaries |

### Shared responsibilities

- Database design and implementation.
- Frontend and backend API integration.
- UI/UX consistency and improvements.
- System testing and debugging.
- Security and access control.
- Technical documentation.
- GitHub collaboration and code reviews.
- Project presentation and final PoC demonstration.

---

## GitHub collaboration

### Branch structure

| Branch | Owner or purpose |
| --- | --- |
| `main` | Stable shared code |
| `feature/authentication` | Reanne |
| `feature/ai-task-extraction` | Gwen |
| `feature/personal-dashboard` | Hung |
| `feature/manager-dashboard` | Cheryl |

### Development workflow

Team members should develop and test their assigned features on their respective feature branches before merging changes into `main`.

#### 1. Clone the repository

```bash
git clone https://github.com/Gwennnnnnn/Task-Management_and_Progress-Tracking-Platform.git
cd Task-Management_and_Progress-Tracking-Platform
```

#### 2. Retrieve the latest changes

```bash
git checkout main
git pull origin main
```

#### 3. Switch to your feature branch

If the branch already exists:

```bash
git switch feature/your-feature-name
```

If the branch has not been created:

```bash
git switch -c feature/your-feature-name
```

Replace `your-feature-name` with your assigned feature branch name.

#### 4. Install dependencies and run the frontend

```bash
cd frontend
npm ci
npm run dev
```

#### 5. Commit your changes

From the repository root, run:

```bash
git status
git add .
git commit -m "Describe your changes"
```

#### 6. Push your feature branch

```bash
git push -u origin feature/your-feature-name
```

#### 7. Create a pull request

- Open the repository on GitHub.
- Navigate to the **Pull requests** tab.
- Create a pull request from your feature branch into `main`.
- Provide a clear description of your changes.
- Request a teammate's review.
- Resolve any conflicts or requested changes before merging.

### Commit message conventions

Use clear and descriptive commit messages.

| Prefix | Purpose |
| --- | --- |
| `feat:` | Introduce a new feature |
| `fix:` | Fix a bug or issue |
| `docs:` | Update documentation |
| `style:` | Update styling or formatting |
| `refactor:` | Improve existing code structure |
| `test:` | Add or update tests |
| `chore:` | Update dependencies or project configuration |

Examples:

```bash
git commit -m "feat: add Kanban task management"
git commit -m "fix: resolve notification display issue"
git commit -m "style: improve dark mode colours"
git commit -m "docs: update project README"
```

### Collaboration guidelines

- Pull the latest changes before starting development.
- Work on your assigned feature branch.
- Avoid pushing directly to `main` unless agreed upon by the team.
- Write clear and descriptive commit messages.
- Test changes locally before pushing.
- Review pull requests before merging.
- Communicate changes that may affect other team members.
- Do not commit generated files, confidential information or credentials.

---

## Security and future scope

### Security considerations

- Use anonymised or synthetic communications for development and testing.
- Keep confidential client information, real passwords and API keys out of GitHub.
- Store sensitive configuration values in environment variables when backend development begins.
- Apply role-based and engagement-level permissions when implementing backend access.
- Use approved, preferably read-only access for live communications.
- Obtain CLA IT security approval before integrating Microsoft Outlook and Teams.
- Require human confirmation before applying AI-generated status suggestions or sending outbound reminders.
- Maintain appropriate audit logs for accountability and traceability.

### Current limitations

- The current PoC uses mock data and simulated authentication.
- AI recommendations are generated using deterministic logic.
- No live Microsoft Outlook or Teams integration is implemented.
- Data is stored locally in the browser rather than in a centralised database.
- Backend APIs and production authentication have not yet been implemented.
- Production security controls require further development and validation.

### Future enhancements

- FastAPI backend development.
- PostgreSQL database integration.
- Microsoft Entra ID authentication.
- Live Microsoft Outlook and Teams integration.
- AI-powered task extraction from communications.
- Automatic identification of task owners, priorities and deadlines.
- Duplicate task detection.
- AI-assisted progress updates based on communications.
- Outlook Calendar synchronisation.
- Automated deadline and progress reminders.
- Advanced employee workload analytics.
- Enhanced manager dashboards and AI insights.
- Persistent task history and audit logs.
- Production deployment and security validation.

---

**NYP Industry Immersion Project (IIP) | Team 9**

*This educational proof of concept requires CLA approval before production use.*
