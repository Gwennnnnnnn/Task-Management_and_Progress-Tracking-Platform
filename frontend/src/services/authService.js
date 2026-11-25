// Mock authentication service. NO real security — this is a demo PoC.
// Credentials are validated against the in-memory USERS list and the active
// session is persisted to localStorage so a refresh keeps the user logged in.

import { USERS } from '../data/mockData.js'
import { load, save, remove, KEYS } from './storage.js'

function getUsers() {
  const savedUsers = load(KEYS.DATA, null)?.users
  const users = Array.isArray(savedUsers) ? savedUsers : USERS
  return users.filter((user) => !user.deletedAt)
}

/**
 * Attempt a mock login. Returns { user } on success or { error } on failure.
 */
export function login(email, password) {
  const normalized = String(email || '').trim().toLowerCase()
  const user = getUsers().find((u) => u.email.toLowerCase() === normalized)

  if (!user || getCredential(user) !== password) {
    return { error: 'Invalid email or password. Use a demo account below.' }
  }

  const safeUser = toSafeUser(user)
  save(KEYS.SESSION, safeUser)
  return { user: safeUser }
}

export function changePassword(userId, currentPassword, newPassword) {
  const user = getUsers().find((candidate) => candidate.id === userId)
  if (!user) return { error: 'Account not found.' }
  if (getCredential(user) !== currentPassword) {
    return { error: 'Your current password is incorrect.' }
  }
  if (newPassword.length < 8) {
    return { error: 'Your new password must be at least 8 characters.' }
  }
  if (newPassword === currentPassword) {
    return { error: 'Your new password must be different from your current password.' }
  }

  const credentials = load(KEYS.CREDENTIALS, {})
  credentials[user.id] = newPassword
  save(KEYS.CREDENTIALS, credentials)
  return { success: true }
}

export function getDemoPassword(userId) {
  const user = getUsers().find((candidate) => candidate.id === userId)
  return user ? getCredential(user) : ''
}

/** Quick login helper for the demo buttons (by user id). */
export function quickLogin(userId) {
  const user = getUsers().find((u) => u.id === userId)
  if (!user) return { error: 'Demo account not found.' }
  const safeUser = toSafeUser(user)
  save(KEYS.SESSION, safeUser)
  return { user: safeUser }
}

export function logout() {
  remove(KEYS.SESSION)
}

export function getSession() {
  const session = load(KEYS.SESSION, null)
  if (!session) return null
  return { ...session, profileImage: getProfileImages()[session.id] || null }
}

export function getProfileImage(userId) {
  return getProfileImages()[userId] || null
}

export function updateProfileImage(userId, profileImage) {
  const user = getUsers().find((candidate) => candidate.id === userId)
  if (!user) return { error: 'Account not found.' }
  if (
    profileImage !== null &&
    (typeof profileImage !== 'string' ||
      !/^data:image\/(?:jpeg|png|webp|gif);base64,/.test(profileImage) ||
      profileImage.length > 1_500_000)
  ) {
    return { error: 'Choose a supported image smaller than 1 MB.' }
  }

  const profileImages = getProfileImages()
  if (profileImage) profileImages[userId] = profileImage
  else delete profileImages[userId]
  save(KEYS.PROFILE_IMAGES, profileImages)

  const session = { ...toSafeUser(user), profileImage: profileImage || null }
  save(KEYS.SESSION, session)
  return { user: session }
}

/** Strip the password before exposing a user object to the app. */
function toSafeUser(user) {
  const { password, ...rest } = user
  return { ...rest, profileImage: getProfileImages()[user.id] || null }
}

function getCredential(user) {
  const credentials = load(KEYS.CREDENTIALS, {})
  return credentials[user.id] || user.password
}

function getProfileImages() {
  return load(KEYS.PROFILE_IMAGES, {})
}
