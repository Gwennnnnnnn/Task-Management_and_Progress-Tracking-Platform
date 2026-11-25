import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { TaskProvider } from './context/TaskContext.jsx'
import { ToastProvider } from './components/Toast/ToastContext.jsx'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx'
import AppLayout from './components/AppLayout.jsx'

import Login from './pages/Login/Login.jsx'
import Profile from './pages/Profile/Profile.jsx'

import StaffOverview from './pages/StaffDashboard/StaffOverview.jsx'
import StaffTasks from './pages/StaffDashboard/StaffTasks.jsx'
import StaffCalendar from './pages/StaffDashboard/StaffCalendar.jsx'

import ManagerOverview from './pages/ManagerDashboard/ManagerOverview.jsx'
import ManagerTasks from './pages/ManagerDashboard/ManagerTasks.jsx'
import ManagerTeam from './pages/ManagerDashboard/ManagerTeam.jsx'
import ManagerCalendar from './pages/ManagerDashboard/ManagerCalendar.jsx'
import AuditLog from './pages/ManagerDashboard/AuditLog.jsx'
import AdministratorDashboard from './pages/AdministratorDashboard/AdministratorDashboard.jsx'

function dashboardPath(role) {
  if (role === 'administrator') return '/administrator'
  return role === 'manager' ? '/manager' : '/staff'
}

// Redirect "/" to the correct landing page based on auth + role.
function HomeRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={dashboardPath(user.role)} replace />
}

// The former "Task Management" (/review) page is retired — incoming tasks are
// now managed directly on the Tasks page. Redirect any old link there.
function TasksRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'administrator' ? '/administrator' : `${dashboardPath(user.role)}/tasks`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TaskProvider>
          <ToastProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Staff workspace */}
            <Route
              element={
                <ProtectedRoute role="staff">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/staff" element={<StaffOverview />} />
              <Route path="/staff/tasks" element={<ProtectedRoute permission="tasks"><StaffTasks /></ProtectedRoute>} />
              <Route path="/staff/calendar" element={<ProtectedRoute permission="calendar"><StaffCalendar /></ProtectedRoute>} />
              {/* Insights now live inside the dashboard; redirect any old link. */}
              <Route path="/staff/insights" element={<Navigate to="/staff" replace />} />
            </Route>

            {/* Manager workspace */}
            <Route
              element={
                <ProtectedRoute role="manager">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/manager" element={<ManagerOverview />} />
              <Route path="/manager/tasks" element={<ProtectedRoute permission="tasks"><ManagerTasks /></ProtectedRoute>} />
              <Route path="/manager/team" element={<ProtectedRoute permission="team"><ManagerTeam /></ProtectedRoute>} />
              <Route path="/manager/calendar" element={<ProtectedRoute permission="calendar"><ManagerCalendar /></ProtectedRoute>} />
              {/* Insights now live inside the dashboard; redirect any old link. */}
              <Route path="/manager/insights" element={<Navigate to="/manager" replace />} />
            </Route>

            {/* Administrator workspace */}
            <Route
              element={
                <ProtectedRoute role="administrator">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/administrator" element={<AdministratorDashboard />} />
              <Route path="/administrator/audit-log" element={<AuditLog />} />
            </Route>

            {/* Retired Task Management page — redirect to Tasks. */}
            <Route path="/review" element={<TasksRedirect />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </ToastProvider>
        </TaskProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
