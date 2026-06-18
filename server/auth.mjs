import crypto from 'node:crypto'

export function toPublicUser(row) {
  if (!row) return null
  return {
    id: String(row.id),
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  }
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

export function extractBearerToken(headers = {}) {
  const authorization = headers.authorization || headers.Authorization || ''
  const match = /^Bearer\s+(.+)$/i.exec(authorization)
  return match ? match[1].trim() : null
}

export async function getCurrentUser(pool, token) {
  if (!token) return null
  const tokenHash = hashToken(token)
  const [rows] = await pool.execute(
    `SELECT users.id, users.email, users.display_name, users.created_at
       FROM refresh_tokens
       JOIN users ON users.id = refresh_tokens.user_id
      WHERE refresh_tokens.token_hash = ?
        AND refresh_tokens.revoked_at IS NULL
        AND refresh_tokens.expires_at > UTC_TIMESTAMP()
      LIMIT 1`,
    [tokenHash],
  )
  return toPublicUser(rows[0])
}
