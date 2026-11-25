import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { DEMO_ACCOUNTS } from '../../data/mockData.js'
import { getDemoPassword } from '../../services/authService.js'
import Avatar from '../../components/Avatar.jsx'
import { LogoMark } from '../../components/Logo.jsx'
import { IconChevronRight, IconMoon, IconSun, IconUser } from '../../components/Icons.jsx'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const { login, quickLogin, isAuthenticated, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('flowsync-theme') === 'dark')

  useEffect(() => {
    localStorage.setItem('flowsync-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // If already logged in, bounce to the right dashboard.
  useEffect(() => {
    if (isAuthenticated) {
      navigate(routeFor(user.role), { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  function routeFor(role) {
    if (role === 'administrator') return '/administrator'
    return role === 'manager' ? '/manager' : '/staff'
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const result = login(email, password)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate(routeFor(result.user.role), { replace: true })
  }

  function handleQuick(account) {
    const result = quickLogin(account.id)
    if (result.user) navigate(routeFor(result.user.role), { replace: true })
  }

  return (
    <div className="login-wrap" data-theme={darkMode ? 'dark' : 'light'}>
      <div className="login-brand">
        <div className="lb-center">
          <div className="lb-logo-badge">
            <LogoMark size={64} onGradient darkMode={darkMode} />
          </div>
          <h1>FlowSync</h1>
          <span className="lb-tagline">Intelligent Task Management</span>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-card fade-in">
          <h3>Sign in</h3>
          <p className="lead">Welcome back. Access your task dashboard.</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@cla-demo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Sign in
            </button>
          </form>

          <div className="divider">or quick login as</div>

          <div className="quick-accounts">
            {DEMO_ACCOUNTS.map((acc) => (
              <button key={acc.id} className="quick-card" onClick={() => handleQuick(acc)}>
                <Avatar
                  name={acc.name}
                  size={42}
                  color={acc.role === 'administrator' ? '#596f8a' : acc.role === 'manager' ? '#78a4cb' : '#95bdd7'}
                />
                <div className="qc-body">
                  <div className="qc-role">{acc.label}</div>
                  <div className="qc-name">{acc.name}</div>
                  <div className="qc-email">{acc.email} · {getDemoPassword(acc.id)}</div>
                </div>
                <IconChevronRight className="qc-go" size={18} />
              </button>
            ))}
          </div>

          <div className="demo-note">
            <IconUser size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            Demo authentication only — no real security. Credentials are stored in the
            browser for the prototype and are not sent anywhere.
          </div>
        </div>
      </div>
      <button
        type="button"
        className="login-theme-toggle"
        onClick={() => setDarkMode((current) => !current)}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? <IconSun size={20} /> : <IconMoon size={20} />}
      </button>
    </div>
  )
}
