import { getPayload, Payload } from 'payload'
import config from '@payload-config'
import type { PostgresAdapter } from '@payloadcms/db-postgres'

/**
 * Extended database type for Postgres adapter
 * Provides access to Drizzle instance for raw SQL queries
 */
export type PayloadDatabase = Payload['db'] & {
  drizzle: PostgresAdapter['drizzle']
}

/**
 * Extended Payload type with typed database access
 */
export type TypedPayload = Omit<Payload, 'db'> & {
  db: PayloadDatabase
}

/**
 * Type guard to check if payload has drizzle instance
 */
export function hasDrizzle(db: Payload['db']): db is PayloadDatabase {
  return 'drizzle' in db && db.drizzle !== undefined
}

/**
 * 获取 Payload 客户端实例
 * 参考 Payload 生成的代码，直接传递 config（可能是 Promise）
 */
export async function getPayloadClient(): Promise<TypedPayload> {
  try {
    const payload = await getPayload({ config })
    return payload as TypedPayload
  } catch (error) {
    throw error
  }
}
