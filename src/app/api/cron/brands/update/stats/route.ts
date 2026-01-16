import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getPayload } from 'payload'
import config from '@payload-config'

export const maxDuration = 300 // 5 minutes

export async function GET(req: NextRequest) {
  const LOCK_KEY = 'cron:brands:update:stats:lock'

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

    // 通过 products 表关联 aba_search_terms，汇总品牌的统计数据
    const result = await db.execute(`
      UPDATE brands b
      SET 
        click_share_sum = COALESCE(s.click_share_sum, 0),
        conversion_share_sum = COALESCE(s.conversion_share_sum, 0),
        weighted_score_sum = COALESCE(s.weighted_score_sum, 0)
      FROM (
        SELECT 
          p.brand_id,
          SUM(COALESCE(ast.click_share, 0)) as click_share_sum,
          SUM(COALESCE(ast.conversion_share, 0)) as conversion_share_sum,
          SUM(COALESCE(ast.weighted_score, 0)) as weighted_score_sum
        FROM products p
        INNER JOIN aba_search_terms ast ON p.asin = ast.asin
        WHERE p.brand_id IS NOT NULL
          AND p.active = true
        GROUP BY p.brand_id
      ) s
      WHERE b.id = s.brand_id
    `)

    const updatedCount = result.rowCount || 0

    await redis.del(LOCK_KEY)

    return NextResponse.json({
      success: true,
      message: 'Brand stats update completed',
      result: {
        brandsUpdated: updatedCount,
      },
    })
  } catch (error) {
    console.error('Brand stats update failed:', error)

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
