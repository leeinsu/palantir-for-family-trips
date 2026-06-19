export const LOCAL_SESSION_STORAGE_KEY = 'palantir-family-trips/session/v1'

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))
}

export function createLocalSession({ email, displayName } = {}, now = new Date()) {
  const normalizedEmail = normalizeEmail(email)
  if (!isValidEmail(normalizedEmail)) {
    throw new Error('A valid email is required')
  }

  const safeDisplayName = String(displayName || '').trim() || normalizedEmail.split('@')[0]
  const issuedAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString()

  return {
    version: 1,
    authProvider: 'local-demo',
    accessToken: `local-demo:${normalizedEmail}:${issuedAt}`,
    user: {
      email: normalizedEmail,
      displayName: safeDisplayName,
    },
    issuedAt,
  }
}

export function parseLocalSession(raw) {
  if (!raw) return null

  try {
    const session = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (session?.version !== 1) return null
    if (session?.authProvider !== 'local-demo') return null
    if (!session?.accessToken || !session?.issuedAt) return null
    if (!isValidEmail(session?.user?.email)) return null

    return {
      ...session,
      user: {
        email: normalizeEmail(session.user.email),
        displayName: String(session.user.displayName || '').trim() || normalizeEmail(session.user.email).split('@')[0],
      },
    }
  } catch {
    return null
  }
}

export function readLocalSession(storage = globalThis.localStorage) {
  if (!storage?.getItem) return null
  return parseLocalSession(storage.getItem(LOCAL_SESSION_STORAGE_KEY))
}

export function getInitialSession(options = {}, storage = globalThis.localStorage) {
  const { requireAuthOnFirstScreen = true } = options
  if (requireAuthOnFirstScreen) return null
  return readLocalSession(storage)
}

export function writeLocalSession(session, storage = globalThis.localStorage) {
  if (!storage?.setItem) return session
  storage.setItem(LOCAL_SESSION_STORAGE_KEY, JSON.stringify(session))
  return session
}

export function clearLocalSession(storage = globalThis.localStorage) {
  if (storage?.removeItem) storage.removeItem(LOCAL_SESSION_STORAGE_KEY)
}
