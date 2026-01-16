import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getPayload } from 'payload'
import config from '@payload-config'

export const maxDuration = 300 // 5 minutes

export async function GET(req: NextRequest) {
  const LOCK_KEY = 'cron:brands:update:asin_count:lock'

  const searchParams = req.nextUrl.searchParams
  const force = searchParams.get('force') === 'true'

  if (force) {
    await redis.del(LOCK_KEY)
  }

  const lockDuration = process.env.NODE_ENV === 'development' ? 60 : 300

  const locked = await redis.set(LOCK_KEY, 'locked', 'EX', lockDuration, 'NX')

  if (!locked) {
    return NextResponse.json(
      {
        success: false,
        message: 'Job already running',
      },
      { status: 429 },
    )
  }

  try {
    const payload = await getPayload({ config })
    const db = payload.db.drizzle

    // Use a single SQL to update all brands' asin_count
    const result = await db.execute(`
      UPDATE brands b
      SET 
        asin_count = COALESCE(counts.cnt, 0),
        updated_at = NOW()
      FROM (
        SELECT brand_id, COUNT(*)::integer AS cnt
        FROM products
        WHERE brand_id IS NOT NULL
        GROUP BY brand_id
      ) counts
      WHERE b.id = counts.brand_id
        AND b.asin_count IS DISTINCT FROM counts.cnt
    `)

    const updatedCount = result.rowCount || 0

    await redis.del(LOCK_KEY)

    return NextResponse.json({
      success: true,
      message: 'Brand asin_count update completed',
      result: {
        brandsUpdated: updatedCount,
      },
    })
  } catch (error) {
    console.error('Brand asin_count update failed:', error)

    await redis.del(LOCK_KEY)

    return NextResponse.json(
      {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
