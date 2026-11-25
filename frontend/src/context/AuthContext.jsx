import { createContext, useContext, useState, useCallback } from 'react'
import * as authService from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getSession())

  const login = useCallback((email, password) => {
    const result = authService.login(email, password)
    if (result.user) setUser(result.user)
    return result
  }, [])

  const quickLogin = useCallback((userId) => {
    const result = authService.quickLogin(userId)
    if (result.user) setUser(result.user)
    return result
  }, [])

  const changePassword = useCallback((currentPassword, newPassword) => {
    if (!user) return { error: 'You must be signed in to change your password.' }
    return authService.changePassword(user.id, currentPassword, newPassword)
  }, [user])

  const updateProfileImage = useCallback((profileImage) => {
    if (!user) return { error: 'You must be signed in to update your profile photo.' }
    const result = authService.updateProfileImage(user.id, profileImage)
    if (result.user) setUser(result.user)
    return result
  }, [user])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = {
    user,
    login,
    quickLogin,
    changePassword,
    updateProfileImage,
    logout,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
