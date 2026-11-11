
# AI-Powered Task Management & Progress Tracking Platform

**NYP Industry Immersion Project (IIP) | Team 9**

An AI-powered task management platform designed to help CLA's audit staff and managers identify, prioritise, manage and monitor tasks from Microsoft Outlook and Teams.

## 1. Project Overview

### Problem Statement

CLA's audit staff currently manage tasks across Outlook, Teams and other communication channels. This leads to:

- Scattered tasks, deadlines and responsibilities.
- Time-consuming manual task tracking and follow-ups.
- Difficulty prioritising urgent tasks.
- Managers repeatedly chasing employees for progress updates.
- Limited visibility of task progress across audit engagements.

### Proposed Solution

Develop an **AI-powered task management platform** that automatically identifies actionable tasks from communications and organises them into personalised dashboards.

**Project Goal:** Reduce manual task follow-up time by at least **50%, from 4 hours to 2 hours per employee per week**, subject to PoC validation.

---

## 2. Key Features

### AI Task Extraction
- Extract actionable tasks from Outlook emails and Teams messages.
- Identify task descriptions, owners, deadlines and priorities.
- Flag missing information and duplicate tasks.
- Allow users and managers to review, edit, confirm or dismiss AI suggestions.

### AI Task Prioritisation
- Suggest High, Medium or Low priority based on urgency, deadlines and task importance.
- Allow users to adjust AI recommendations.

### Personalised Staff Dashboard
- View and manage assigned tasks.
- Monthly and weekly calendar showing task deadlines.
- Visual progress bars and task status tracking.
- AI-assisted task status suggestions.

### Manager Dashboard
- View personal tasks and authorised team members' tasks.
- Monitor employee progress and outstanding work.
- Identify overdue tasks and potential bottlenecks.
- View AI-generated team progress summaries.

### Task Progress & Notifications
- Update task statuses: To Do, In Progress, Pending Internal Review, Pending Client, Pending Clarification and Completed.
- Track task history and progress updates.
- Use AI to suggest task status updates based on available information.
- Notify users about deadlines and missing progress updates.
- Require user approval before sending outbound reminders.

---

## 3. Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React, JavaScript, CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| Authentication | Microsoft Entra ID (Proposed) |
| Outlook / Teams Integration | Microsoft Graph API (Subject to approval) |
| AI | Approved AI Model (TBD) |
| Version Control | Git & GitHub |
| IDE | Visual Studio Code |

---

## 4. Team Responsibilities

All four members will contribute to **both frontend and backend development**.

| Member | Main Responsibility | Frontend | Backend |
|--------|---------------------|----------|---------|
| **Reanne** | Authentication & Account Integration | Login, user profiles, account settings, role-based navigation | Authentication, user permissions, account management APIs |
| **Gwen** | AI Task Extraction & Approval Management | Outlook/Teams connection interface, AI task suggestions, user/manager approval, task creation and editing | Microsoft Graph integration, AI task extraction, approval workflow, task APIs, database operations and notifications |
| **Hung** | Staff Dashboard & AI Task Tracking | Personal dashboard, calendar, progress bars, task filtering, task status updates | Personal task retrieval, progress tracking, AI-assisted status suggestions and task history |
| **Cheryl** | Manager Dashboard & AI Insights | Manager dashboard, team overview, employee progress tracking, AI summaries | Team task APIs, AI prioritisation, team progress monitoring and AI-generated summaries |

**Shared Responsibilities:**
- Database design and API integration
- Testing and debugging
- Documentation
- GitHub collaboration
- Final PoC demonstration

---

## 5. Project Structure

```text
Task-Management_and_Progress-Tracking-Platform/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/
├── backend/
│   ├── routes/
│   ├── services/
│   ├── models/
│   └── main.py
├── sample-data/
├── docs/
├── .gitignore
└── README.md
```

**Folder Overview:**
- `frontend/` - React application and UI components.
- `backend/` - APIs, database models and business logic.
- `sample-data/` - Anonymised or synthetic test communications.
- `docs/` - Project planning and technical documentation.

---

## 6. GitHub Collaboration

Each member will develop their assigned module using a separate feature branch.

| Branch | Assigned Member |
|--------|-----------------|
| `main` | Stable shared code |
| `feature/authentication` | Reanne |
| `feature/ai-task-extraction` | Gwen |
| `feature/personal-dashboard` | Hung |
| `feature/manager-dashboard` | Cheryl |

### Development Workflow

1. Clone the repository.
2. Create or switch to your feature branch.
3. Develop and test your assigned features.
4. Commit and push changes.
5. Create a Pull Request.
6. Request a teammate's review before merging into `main`.

**Do not push unfinished code directly to `main`.**

---

## 7. Security & PoC Scope

- Use **anonymised or synthetic Outlook and Teams messages** for initial development.
- Enforce role-based and engagement-level permissions.
- Use approved, preferably read-only communication access.
- Do not upload confidential client data, passwords or API keys to GitHub.
- Require human confirmation for AI task suggestions and outbound reminders.
- Live Outlook and Teams integration requires **CLA's IT security approval**.

### Initial PoC

- AI task extraction and user/manager approval
- Personalised staff dashboard
- Manager dashboard
- Calendar and progress tracking
- AI-assisted task status suggestions
- AI prioritisation and progress summaries
- Task notifications

### Future Enhancements

- Live Outlook and Teams integration
- Automatic progress updates from communications
- Outlook Calendar synchronisation
- Advanced workload analytics

---

*This project is a proof of concept for educational purposes and is not intended for production use without CLA's approval.*
