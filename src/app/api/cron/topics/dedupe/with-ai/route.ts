import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getPayloadClient } from '@/lib/payload'
import { findDuplicateTopicsWithAI } from '@/services/topics/ai-dedupe-topics'
import {
  getTopicsForDeduplication,
  mapDuplicateGroupsToTopics,
  applyDuplicateRedirects,
} from '@/services/topics/dedupe-topics'
import { AnthropicClient } from '@/services/anthropic-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

/**
 * AI-powered deduplication cron job
 * beta version - 不稳定，谨慎使用
 *
 * @param req NextRequest
 * @returns NextResponse
 */
export async function GET(req: NextRequest) {
  const LOCK_KEY = 'cron:topics:dedupe:with-ai:lock'

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
    const anthropicClient = new AnthropicClient()

    // 1. Get topics data
    const topics = await getTopicsForDeduplication(payload)

    // 2. Extract names for AI analysis
    const names = topics.map((t) => t.name)

    // 3. Find duplicates using AI
    const duplicateNameGroups = await findDuplicateTopicsWithAI(anthropicClient, names)

    // 4. Map name groups back to full topic objects with isMain logic
    const duplicateGroups = mapDuplicateGroupsToTopics(topics, duplicateNameGroups)

    // 5. Apply redirects
    const redirectResult = await applyDuplicateRedirects(payload, duplicateGroups)

    // Release lock
    await redis.del(LOCK_KEY)

    return NextResponse.json({
      success: true,
      message: 'AI-powered deduplication completed',
      method: 'AI',
      totalTopics: topics.length,
      totalDuplicates: duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0),
      duplicateGroups: duplicateGroups,
      redirectsApplied: redirectResult.totalUpdated,
    })
  } catch (error) {
    console.error('AI deduplication error:', error)

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
