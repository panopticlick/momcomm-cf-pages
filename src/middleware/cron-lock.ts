import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export interface CronLockOptions {
  lockKey: string
  lockDuration?: number // in seconds, defaults based on NODE_ENV
}

export interface CronLockResult {
  success: boolean
  response?: NextResponse
  lock?: {
    release: () => Promise<void>
  }
}

/**
 * Acquire a Redis-based lock for cron jobs to prevent overlapping executions
 *
 * @param options - Lock configuration
 * @returns Lock result with release function
 *
 * @example
 * ```ts
 * const lockResult = await acquireCronLock({ lockKey: 'cron:my-job:lock' })
 * if (!lockResult.success) {
 *   return lockResult.response
 * }
 *
 * try {
 *   // Your cron logic here
 * } finally {
 *   await lockResult.lock.release()
 * }
 * ```
 */
export async function acquireCronLock(
  req: Request,
  options: CronLockOptions,
): Promise<CronLockResult> {
  const { lockKey, lockDuration } = options

  // Parse URL for force parameter
  const url = new URL(req.url)
  const force = url.searchParams.get('force') === 'true'

  // Release lock if forced
  if (force) {
    await redis.del(lockKey)
  }

  // Use shorter duration in dev for easier debugging
  const defaultDuration = process.env.NODE_ENV === 'development' ? 60 : 300
  const duration = lockDuration ?? defaultDuration

  // Try to acquire lock using Redis SET with NX (only set if not exists)
  const acquired = await redis.set(lockKey, 'locked', 'EX', duration, 'NX')

  if (!acquired) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: 'Job already running',
        },
        { status: 429 },
      ),
    }
  }

  return {
    success: true,
    lock: {
      release: async () => {
        await redis.del(lockKey)
      },
    },
  }
}

/**
 * Wrapper function for cron handlers that automatically manages locks
 *
 * @param lockKey - Unique key for this cron job
 * @param handler - Async function to execute while holding the lock
 * @returns NextResponse
 *
 * @example
 * ```ts
 * export async function GET(req: NextRequest) {
 *   return withCronLock(req, { lockKey: 'cron:my-job:lock' }, async () => {
 *     // Your cron logic here
 *     return NextResponse.json({ success: true })
 *   })
 * }
 * ```
 */
export async function withCronLock(
  req: Request,
  options: CronLockOptions,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const lockResult = await acquireCronLock(req, options)

  if (!lockResult.success) {
    return lockResult.response!
  }

  try {
    return await handler()
  } finally {
    await lockResult.lock!.release()
  }
}
