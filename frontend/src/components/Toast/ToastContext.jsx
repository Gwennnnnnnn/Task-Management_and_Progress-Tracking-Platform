// Minimal toast system: a provider that renders a stack of transient messages
// (via a portal) and a useToast() hook to push them. No external dependency.

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconCheck } from '../Icons.jsx'
import './Toast.css'

const ToastContext = createContext(null)

let seq = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const toast = useCallback(
    (message, { tone = 'success', duration = 2600 } = {}) => {
      seq += 1
      const id = `toast-${seq}`
      setToasts((list) => [...list, { id, message, tone }])
      timers.current[id] = setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="toast-stack" aria-live="polite" aria-atomic="true">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.tone}`} role="status" onClick={() => dismiss(t.id)}>
              <span className="toast-ic"><IconCheck size={15} /></span>
              <span>{t.message}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  // Safe no-op if used outside a provider (keeps components resilient).
  return ctx || { toast: () => {} }
}
