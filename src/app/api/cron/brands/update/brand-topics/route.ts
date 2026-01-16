import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { syncBrandTopics } from '@/services/brands/sync-brand-topics'

export const maxDuration = 300 // 5 minutes

export async function GET(req: NextRequest) {
  const LOCK_KEY = 'cron:brands:update:brand-topics:lock'

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
    const result = await syncBrandTopics()

    await redis.del(LOCK_KEY)

    return NextResponse.json({
      success: true,
      message: 'Brand topics sync completed',
      result,
    })
  } catch (error) {
    console.error('Brand topics sync failed:', error)

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
