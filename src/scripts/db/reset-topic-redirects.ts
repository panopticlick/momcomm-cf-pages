/**
 * Reset all topic redirects
 * Sets redirect = false and redirect_to = null for all topics
 *
 * Usage: npx tsx src/scripts/db/reset-topic-redirects.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'

async function resetTopicRedirects() {
  console.log('Initializing Payload...')
  const payload = await getPayload({ config })

  console.log('Resetting all topic redirects...')

  const db = payload.db.drizzle
  const query = sql`
    UPDATE topics
    SET 
      redirect = false,
      redirect_to = NULL,
      updated_at = NOW()
  `

  await db.execute(query)

  // Get count of affected rows
  const { rows } = await db.execute(sql`SELECT COUNT(*) as count FROM topics`)
  const count = (rows[0] as { count: number }).count

  console.log(`✅ Reset ${count} topics: redirect = false, redirect_to = NULL`)

  process.exit(0)
}

resetTopicRedirects().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
