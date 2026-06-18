#!/usr/bin/env node
import http from 'node:http'
import { URL } from 'node:url'
import { extractBearerToken, getCurrentUser } from './auth.mjs'
import { createDbPool, getDbConfig } from './db.mjs'

const port = Number(process.env.PORT || 8787)
const dbStatus = getDbConfig(process.env)
const pool = dbStatus.ok ? createDbPool(process.env) : null

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  response.end(JSON.stringify(payload))
}

function sendError(response, statusCode, code, message, details = {}) {
  sendJson(response, statusCode, { error: { code, message, details } })
}

async function route(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)

  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, {
      ok: true,
      service: 'palantir-family-trips-api',
      dbConfigured: dbStatus.ok,
      missingDbEnv: dbStatus.missing,
    })
    return
  }

  if (!pool) {
    sendError(response, 503, 'DB_NOT_CONFIGURED', 'Database environment is not configured', { missing: dbStatus.missing })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/auth/me') {
    const user = await getCurrentUser(pool, extractBearerToken(request.headers))
    if (!user) {
      sendError(response, 401, 'UNAUTHORIZED', 'A valid bearer token is required')
      return
    }
    sendJson(response, 200, { user })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/trips') {
    const user = await getCurrentUser(pool, extractBearerToken(request.headers))
    if (!user) {
      sendError(response, 401, 'UNAUTHORIZED', 'A valid bearer token is required')
      return
    }

    const [rows] = await pool.execute(
      `SELECT trips.id, trips.title, trips.start_date, trips.end_date, trips.timezone, trips.updated_at
         FROM trips
         JOIN trip_members ON trip_members.trip_id = trips.id
        WHERE trip_members.user_id = ? AND trips.deleted_at IS NULL
        ORDER BY trips.updated_at DESC`,
      [user.id],
    )
    sendJson(response, 200, { trips: rows })
    return
  }

  sendError(response, 404, 'NOT_FOUND', 'API route not found')
}

const server = http.createServer((request, response) => {
  route(request, response).catch((error) => {
    console.error(error)
    sendError(response, 500, 'INTERNAL_ERROR', 'Unexpected API error')
  })
})

server.listen(port, () => {
  console.log(`API skeleton listening on http://localhost:${port}`)
})

process.on('SIGTERM', async () => {
  server.close()
  if (pool) await pool.end()
})
