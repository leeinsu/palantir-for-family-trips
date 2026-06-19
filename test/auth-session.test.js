import test from 'node:test'
import assert from 'node:assert/strict'

import {
  clearLocalSession,
  createLocalSession,
  createPasswordSession,
  createSsoSession,
  LOCAL_SESSION_STORAGE_KEY,
  getInitialSession,
  normalizeEmail,
  normalizeLoginId,
  parseLocalSession,
  readLocalSession,
  writeLocalSession,
} from '../src/auth/session.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

test('normalizeEmail trims and lowercases emails', () => {
  assert.equal(normalizeEmail('  Family@Example.COM '), 'family@example.com')
})

test('normalizeLoginId trims ids without requiring email shape', () => {
  assert.equal(normalizeLoginId('  Wombat_01  '), 'Wombat_01')
})

test('createLocalSession creates a deterministic local demo session', () => {
  const session = createLocalSession(
    { email: ' FAMILY@Example.com ', displayName: ' Family Planner ' },
    new Date('2026-06-17T00:00:00.000Z'),
  )

  assert.equal(session.version, 1)
  assert.equal(session.authProvider, 'local-demo')
  assert.equal(session.user.email, 'family@example.com')
  assert.equal(session.user.displayName, 'Family Planner')
  assert.equal(session.issuedAt, '2026-06-17T00:00:00.000Z')
  assert.equal(session.accessToken, 'local-demo:family@example.com:2026-06-17T00:00:00.000Z')
})

test('createPasswordSession authenticates with id and password fields', () => {
  const session = createPasswordSession(
    { id: ' wombat ', password: 'secret-password' },
    new Date('2026-06-17T02:00:00.000Z'),
  )

  assert.equal(session.authProvider, 'password')
  assert.equal(session.user.id, 'wombat')
  assert.equal(session.user.displayName, 'wombat')
  assert.equal(session.issuedAt, '2026-06-17T02:00:00.000Z')
  assert.equal(session.accessToken, 'password:wombat:2026-06-17T02:00:00.000Z')
  assert.throws(() => createPasswordSession({ id: '', password: 'secret-password' }), /ID is required/)
  assert.throws(() => createPasswordSession({ id: 'wombat', password: '' }), /Password is required/)
})

test('createSsoSession creates a supported SSO session', () => {
  const session = createSsoSession(
    { provider: 'google', subject: 'google-user-1', displayName: 'Google User' },
    new Date('2026-06-17T03:00:00.000Z'),
  )

  assert.equal(session.authProvider, 'sso:google')
  assert.equal(session.user.id, 'google:google-user-1')
  assert.equal(session.user.displayName, 'Google User')
  assert.equal(session.accessToken, 'sso:google:google-user-1:2026-06-17T03:00:00.000Z')
  assert.throws(() => createSsoSession({ provider: 'unknown' }), /Unsupported SSO provider/)
})

test('parseLocalSession rejects invalid session payloads', () => {
  assert.equal(parseLocalSession('not json'), null)
  assert.equal(parseLocalSession(JSON.stringify({ version: 2 })), null)
  assert.equal(parseLocalSession(JSON.stringify({ version: 1, authProvider: 'local-demo', user: { email: 'bad' } })), null)
})

test('read/write/clear local session works with storage abstraction', () => {
  const storage = memoryStorage()
  const session = createLocalSession({ email: 'pilot@example.com' }, new Date('2026-06-17T01:00:00.000Z'))

  writeLocalSession(session, storage)
  assert.equal(JSON.parse(storage.getItem(LOCAL_SESSION_STORAGE_KEY)).user.email, 'pilot@example.com')
  assert.deepEqual(readLocalSession(storage), session)
  clearLocalSession(storage)
  assert.equal(readLocalSession(storage), null)
})

test('getInitialSession starts at auth screen even when a session exists by default', () => {
  const storage = memoryStorage()
  const session = createLocalSession({ email: 'pilot@example.com' }, new Date('2026-06-17T01:00:00.000Z'))

  writeLocalSession(session, storage)

  assert.equal(getInitialSession({}, storage), null)
  assert.deepEqual(getInitialSession({ requireAuthOnFirstScreen: false }, storage), session)
})
