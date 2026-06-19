export const LOCAL_SESSION_STORAGE_KEY = 'palantir-family-trips/session/v1'
export const SUPPORTED_SSO_PROVIDERS = ['google', 'apple', 'microsoft']

export function normalizeLoginId(id) {
  return String(id || '').trim()
}

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

export function createPasswordSession({ id, password, displayName } = {}, now = new Date()) {
  const loginId = normalizeLoginId(id)
  if (!loginId) throw new Error('ID is required')
  if (!String(password || '').trim()) throw new Error('Password is required')

  const issuedAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString()
  const safeDisplayName = String(displayName || '').trim() || loginId

  return {
    version: 1,
    authProvider: 'password',
    accessToken: `password:${loginId}:${issuedAt}`,
    user: {
      id: loginId,
      displayName: safeDisplayName,
    },
    issuedAt,
  }
}

export function createSsoSession({ provider, subject, displayName } = {}, now = new Date()) {
  const normalizedProvider = String(provider || '').trim().toLowerCase()
  if (!SUPPORTED_SSO_PROVIDERS.includes(normalizedProvider)) {
    throw new Error('Unsupported SSO provider')
  }

  const normalizedSubject = normalizeLoginId(subject) || `${normalizedProvider}-demo-user`
  const issuedAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString()
  const safeDisplayName = String(displayName || '').trim() || `${normalizedProvider.toUpperCase()} User`

  return {
    version: 1,
    authProvider: `sso:${normalizedProvider}`,
    accessToken: `sso:${normalizedProvider}:${normalizedSubject}:${issuedAt}`,
    user: {
      id: `${normalizedProvider}:${normalizedSubject}`,
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
    if (!session?.accessToken || !session?.issuedAt) return null

    if (session.authProvider === 'local-demo') {
      if (!isValidEmail(session?.user?.email)) return null
      return {
        ...session,
        user: {
          email: normalizeEmail(session.user.email),
          displayName: String(session.user.displayName || '').trim() || normalizeEmail(session.user.email).split('@')[0],
        },
      }
    }

    if (session.authProvider === 'password') {
      const id = normalizeLoginId(session?.user?.id)
      if (!id) return null
      return {
        ...session,
        user: {
          id,
          displayName: String(session.user.displayName || '').trim() || id,
        },
      }
    }

    if (String(session.authProvider || '').startsWith('sso:')) {
      const provider = String(session.authProvider).slice(4)
      const id = normalizeLoginId(session?.user?.id)
      if (!SUPPORTED_SSO_PROVIDERS.includes(provider) || !id) return null
      return {
        ...session,
        user: {
          id,
          displayName: String(session.user.displayName || '').trim() || `${provider.toUpperCase()} User`,
        },
      }
    }

    return null
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
