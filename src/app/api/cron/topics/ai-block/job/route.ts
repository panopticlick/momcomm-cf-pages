import { getPayloadClient } from '@/lib/payload'
import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { processAiBlockJobs } from '@/services/cron/process-ai-block-jobs'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function GET(req: NextRequest) {
  const LOCK_KEY = 'cron:topics:ai-block:job:lock'

  // Clean lock if force=true
  const searchParams = req.nextUrl.searchParams
  const force = searchParams.get('force') === 'true'
  const limit = parseInt(searchParams.get('limit') || '1', 10)
  if (force) {
    await redis.del(LOCK_KEY)
  }

  // Try to acquire lock
  // Use a longer duration for job execution (e.g. 5 minutes)
  const lockDuration = 300
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

  const payload = await getPayloadClient()

  try {
    const { processed, errors } = await processAiBlockJobs(payload, limit)

    await redis.del(LOCK_KEY)

    return NextResponse.json({
      success: true,
      processed,
      errors,
    })
  } catch (error) {
    console.error('Fatal cron error:', error)
    await redis.del(LOCK_KEY)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
