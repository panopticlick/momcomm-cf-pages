import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { publishTopics } from '@/services/topics/publish-topics'

export const maxDuration = 300 // 5 minutes

export async function GET(req: NextRequest) {
  const LOCK_KEY = 'cron:topics:publish:lock'

  const searchParams = req.nextUrl.searchParams
  const force = searchParams.get('force') === 'true'
  const limit = parseInt(searchParams.get('limit') || '10', 10)

  if (force) {
    await redis.del(LOCK_KEY)
  }

  // Use shorter duration in dev for easier debugging
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
    const result = await publishTopics({ limit })

    await redis.del(LOCK_KEY)

    return NextResponse.json({
      success: true,
      message: 'Topics publish completed',
      result,
    })
  } catch (error) {
    console.error('Job failed:', error)
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
