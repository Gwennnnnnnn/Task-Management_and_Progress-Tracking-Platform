// Small localStorage helper used for demo persistence. All reads/writes are
// JSON-encoded and fail gracefully when storage is unavailable.

const PREFIX = 'cla-tms:'

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Ignore quota / privacy-mode errors in a demo context.
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // no-op
  }
}

export const KEYS = {
  SESSION: 'session',
  DATA: 'data',
  CREDENTIALS: 'credentials',
  PROFILE_IMAGES: 'profile-images'
}
