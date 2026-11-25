// Guards routes behind mock authentication and (optionally) a required role.
// Simulates engagement/role-based access control for the PoC.

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import { hasPermission } from '../../services/taskService.js'

function dashboardPath(role) {
  if (role === 'administrator') return '/administrator'
  return role === 'manager' ? '/manager' : '/staff'
}

export default function ProtectedRoute({ children, role, permission }) {
  const { user, isAuthenticated } = useAuth()
  const { users } = useTasks()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const currentUser = users.find((candidate) => candidate.id === user.id) || user

  if (role && currentUser.role !== role) {
    return <Navigate to={dashboardPath(currentUser.role)} replace />
  }

  if (permission && !hasPermission(currentUser, permission)) {
    return <Navigate to={dashboardPath(currentUser.role)} replace />
  }

  return children
}
