import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { redis } from '@/lib/redis'
import { config } from '@/lib/config'

export const dynamic = 'force-dynamic'

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  checks: {
    database: {
      status: 'pass' | 'fail'
      duration?: number
      error?: string
    }
    redis: {
      status: 'pass' | 'fail'
      duration?: number
      error?: string
    }
  }
  responseTime: number
}

/**
 * Health check endpoint for monitoring application status
 *
 * Returns:
 * - 200: All critical services healthy
 * - 503: One or more critical services down
 *
 * @example
 * GET /api/health
 */
export async function GET() {
  const startTime = Date.now()
  const results: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: 'pass' },
      redis: { status: 'pass' },
    },
    responseTime: 0,
  }

  const errors: string[] = []

  // Database health check
  if (config.health.checks.database) {
    const dbStart = Date.now()
    try {
      const payload = await getPayloadClient()

      // Simple query to test connection
      await payload.find({
        collection: 'users',
        where: { id: { exists: true } },
        limit: 1,
        depth: 0,
      })

      results.checks.database = {
        status: 'pass',
        duration: Date.now() - dbStart,
      }
    } catch (error) {
      results.checks.database = {
        status: 'fail',
        duration: Date.now() - dbStart,
        error: error instanceof Error ? error.message : String(error),
      }
      errors.push('database')
    }
  }

  // Redis health check
  if (config.health.checks.redis) {
    const redisStart = Date.now()
    try {
      const result = await redis.ping()
      if (result === 'PONG') {
        results.checks.redis = {
          status: 'pass',
          duration: Date.now() - redisStart,
        }
      } else {
        throw new Error('Unexpected PING response')
      }
    } catch (error) {
      results.checks.redis = {
        status: 'fail',
        duration: Date.now() - redisStart,
        error: error instanceof Error ? error.message : String(error),
      }
      errors.push('redis')
    }
  }

  // Calculate overall status
  results.responseTime = Date.now() - startTime

  if (errors.length > 0) {
    results.status = errors.length === Object.keys(results.checks).length ? 'unhealthy' : 'degraded'
    return NextResponse.json(results, { status: 503 })
  }

  return NextResponse.json(results, { status: 200 })
}
