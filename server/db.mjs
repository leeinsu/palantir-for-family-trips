import mysql from 'mysql2/promise'

export function getDbConfig(env = process.env) {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
  const missing = required.filter((key) => !env[key])
  if (missing.length) {
    return { ok: false, missing, config: null }
  }

  return {
    ok: true,
    missing: [],
    config: {
      host: env.DB_HOST,
      port: Number(env.DB_PORT || 3306),
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: Number(env.DB_POOL_LIMIT || 10),
      connectTimeout: Number(env.DB_CONNECT_TIMEOUT || 10000),
    },
  }
}

export function createDbPool(env = process.env) {
  const result = getDbConfig(env)
  if (!result.ok) {
    throw new Error(`Missing required DB env vars: ${result.missing.join(', ')}`)
  }
  return mysql.createPool(result.config)
}
