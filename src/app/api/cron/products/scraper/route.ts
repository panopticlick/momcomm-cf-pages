import { type NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
// import Redis from 'ioredis' // Removed unused import
import { processScraperTasks } from '@/services/products/scraper'
import { getPayloadClient } from '@/lib/payload'

export const maxDuration = 300 // 5 minutes

export async function GET(req: NextRequest) {
  // const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379') // Removed local instance
  const lockKey = 'cron:products:scraper:lock'

  const searchParams = req.nextUrl.searchParams
  const force = searchParams.get('force') === 'true'

  if (force) {
    await redis.del(lockKey)
  }

  // EX 600 -- Set the specified expire time, in seconds.
  // Use shorter duration in dev for easier debugging
  const lockDuration = process.env.NODE_ENV === 'development' ? 60 : 300

  // Try to acquire lock
  // SET resource_name my_random_value NX PX 30000
  // NX -- Only set the key if it does not already exist.
  const acquired = await redis.set(lockKey, 'locked', 'EX', lockDuration, 'NX')

  if (!acquired) {
    // await redis.quit() // Do not quit shared connection

    return NextResponse.json({
      success: false,
      message: 'Job already running',
    })
  }

  try {
    const payload = await getPayloadClient()
    const result = await processScraperTasks(payload, 5)

    // Release lock before returning
    await redis.del(lockKey)
    // await redis.quit() // Do not quit shared connection

    return NextResponse.json({
      success: true,
      message: 'Product scraper completed',
      result,
    })
  } catch (error) {
    console.error('Error in product scraper cron:', error)
    // Ensure lock is released even on error
    await redis.del(lockKey)
    // await redis.quit() // Do not quit shared connection

    return NextResponse.json(
      {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
  // Remove finally block as we handle cleanup in try/catch to ensure correct response flow
}
