import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { syncNodeTopics } from '@/services/topics/sync-nodes'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function GET(req: NextRequest) {
  // Use a simple lock key to prevent overlapping executions
  const LOCK_KEY = 'cron:topics:nodes:lock'

  const searchParams = req.nextUrl.searchParams
  const force = searchParams.get('force') === 'true'

  if (force) {
    await redis.del(LOCK_KEY)
  }

  // Use shorter duration in dev for easier debugging
  const lockDuration = process.env.NODE_ENV === 'development' ? 60 : 300

  // Try to acquire lock
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
    const result = await syncNodeTopics()

    // Release lock
    await redis.del(LOCK_KEY)

    return NextResponse.json({
      success: true,
      message: 'Node topics sync completed',
      result,
    })
  } catch (error) {
    console.error('Job failed:', error)

    // Ensure lock is released even on error
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
