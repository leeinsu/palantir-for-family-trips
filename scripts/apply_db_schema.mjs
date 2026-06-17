#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import mysql from 'mysql2/promise'

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return

  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) continue

    const [rawKey, ...rawValueParts] = line.split('=')
    const key = rawKey.trim()
    const value = rawValueParts.join('=').trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

function stripSqlComments(sql) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
}

function splitSqlStatements(sql) {
  return stripSqlComments(sql)
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
}

const projectRoot = path.resolve(import.meta.dirname, '..')
loadDotEnv(path.join(projectRoot, '.env.local'))

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
const missing = requiredEnv.filter((key) => !process.env[key])
if (missing.length) {
  console.error(`Missing required DB env vars: ${missing.join(', ')}`)
  process.exit(2)
}

const schemaPath = path.join(projectRoot, 'database', 'schema.sql')
const statements = splitSqlStatements(fs.readFileSync(schemaPath, 'utf8'))

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 10000),
  multipleStatements: false,
})

try {
  await connection.beginTransaction()
  for (const statement of statements) {
    await connection.execute(statement)
  }
  await connection.commit()
  console.log(
    `Applied ${statements.length} SQL statements to ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME} as ${process.env.DB_USER}`,
  )
} catch (error) {
  await connection.rollback()
  console.error(error)
  process.exitCode = 1
} finally {
  await connection.end()
}
