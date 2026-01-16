import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getPayloadClient } from '@/lib/payload'
import { deduplicateTopics, applyDuplicateRedirects } from '@/services/topics/dedupe-topics'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function GET(req: NextRequest) {
  const LOCK_KEY = 'cron:topics:dedupe:lock'

  const searchParams = req.nextUrl.searchParams
  const force = searchParams.get('force') === 'true'

  if (force) {
    await redis.del(LOCK_KEY)
  }

  // Use longer duration for AI processing
  const lockDuration = 300

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
    const payload = await getPayloadClient()
    const result = await deduplicateTopics(payload)

    // Apply redirects to duplicate topics
    const redirectResult = await applyDuplicateRedirects(payload, result.duplicateGroups)

    // Release lock
    await redis.del(LOCK_KEY)

    return NextResponse.json({
      success: true,
      message: 'Deduplication completed',
      ...result,
      redirectsApplied: redirectResult.totalUpdated,
    })
  } catch (error) {
    console.error('Deduplication error:', error)

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
