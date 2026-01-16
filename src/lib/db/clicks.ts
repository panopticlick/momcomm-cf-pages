import { getPayloadClient } from '@/lib/payload'
import { sql } from '@payloadcms/db-postgres'

export interface ClickTrackingData {
  asin: string
  timestamp: Date
  referrer?: string | null
  userAgent?: string | null
  ip?: string | null
}

/**
 * Track affiliate link click
 */
export async function trackClick(data: ClickTrackingData): Promise<void> {
  try {
    const payload = await getPayloadClient()
    const db = payload.db.drizzle

    await db.execute(sql`
      INSERT INTO clicks (
        asin,
        timestamp,
        referrer,
        user_agent,
        ip,
        created_at
      ) VALUES (
        ${data.asin},
        ${data.timestamp.toISOString()},
        ${data.referrer || null},
        ${data.userAgent || null},
        ${data.ip || null},
        NOW()
      )
    `)
  } catch (error) {
    // Silently fail to not block redirects
    console.error('Failed to track click:', error)
  }
}

/**
 * Get click statistics for an ASIN
 */
export async function getClickStats(asin: string, days: number = 30) {
  try {
    const payload = await getPayloadClient()
    const db = payload.db.drizzle

    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total_clicks,
        COUNT(DISTINCT DATE(timestamp)) as days_with_clicks,
        MIN(timestamp) as first_click,
        MAX(timestamp) as last_click
      FROM clicks
      WHERE asin = ${asin}
        AND timestamp >= NOW() - INTERVAL '${days} days'
    `)

    return result.rows[0] as {
      total_clicks: number
      days_with_clicks: number
      first_click: string
      last_click: string
    } | null
  } catch (error) {
    console.error('Failed to get click stats:', error)
    return null
  }
}

/**
 * Get daily click counts for an ASIN
 */
export async function getDailyClicks(asin: string, days: number = 30) {
  try {
    const payload = await getPayloadClient()
    const db = payload.db.drizzle

    const result = await db.execute(sql`
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as clicks
      FROM clicks
      WHERE asin = ${asin}
        AND timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `)

    return result.rows as Array<{ date: string; clicks: number }>
  } catch (error) {
    console.error('Failed to get daily clicks:', error)
    return []
  }
}
