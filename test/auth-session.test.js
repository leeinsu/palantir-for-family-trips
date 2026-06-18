import test from 'node:test'
import assert from 'node:assert/strict'

import {
  clearLocalSession,
  createLocalSession,
  LOCAL_SESSION_STORAGE_KEY,
  normalizeEmail,
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
