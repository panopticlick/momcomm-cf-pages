import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/health/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/payload', () => ({
  getPayloadClient: vi.fn(),
}))

vi.mock('@/lib/redis', () => ({
  redis: {
    ping: vi.fn(),
  },
}))

vi.mock('@/lib/config', () => ({
  config: {
    health: {
      timeout: 5000,
      checks: {
        database: true,
        redis: true,
        externalApis: false,
      },
    },
  },
}))

import { getPayloadClient } from '@/lib/payload'
import { redis } from '@/lib/redis'

describe('Health Check API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 when all checks pass', async () => {
    vi.mocked(getPayloadClient).mockResolvedValue({
      find: vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
    } as any)
    vi.mocked(redis.ping).mockResolvedValue('PONG')

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.checks.database.status).toBe('pass')
    expect(data.checks.redis.status).toBe('pass')
    expect(data.responseTime).toBeGreaterThanOrEqual(0)
  })

  it('should return 503 when database is down', async () => {
    vi.mocked(getPayloadClient).mockRejectedValue(new Error('Database connection failed'))
    vi.mocked(redis.ping).mockResolvedValue('PONG')

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('degraded')
    expect(data.checks.database.status).toBe('fail')
    expect(data.checks.database.error).toBe('Database connection failed')
    expect(data.checks.redis.status).toBe('pass')
  })

  it('should return 503 when Redis is down', async () => {
    vi.mocked(getPayloadClient).mockResolvedValue({
      find: vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
    } as any)
    vi.mocked(redis.ping).mockRejectedValue(new Error('Redis connection failed'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('degraded')
    expect(data.checks.database.status).toBe('pass')
    expect(data.checks.redis.status).toBe('fail')
    expect(data.checks.redis.error).toBe('Redis connection failed')
  })

  it('should return 503 with degraded status when one check fails', async () => {
    vi.mocked(getPayloadClient).mockRejectedValue(new Error('DB error'))
    vi.mocked(redis.ping).mockResolvedValue('PONG')

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('degraded')
  })

  it('should include duration in each check', async () => {
    vi.mocked(getPayloadClient).mockResolvedValue({
      find: vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
    } as any)
    vi.mocked(redis.ping).mockResolvedValue('PONG')

    const response = await GET()
    const data = await response.json()

    expect(data.checks.database.duration).toBeDefined()
    expect(typeof data.checks.database.duration).toBe('number')
    expect(data.checks.redis.duration).toBeDefined()
    expect(typeof data.checks.redis.duration).toBe('number')
  })

  it('should include timestamp and uptime', async () => {
    vi.mocked(getPayloadClient).mockResolvedValue({
      find: vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
    } as any)
    vi.mocked(redis.ping).mockResolvedValue('PONG')

    const response = await GET()
    const data = await response.json()

    expect(data.timestamp).toBeDefined()
    expect(new Date(data.timestamp)).toBeInstanceOf(Date)
    expect(data.uptime).toBeDefined()
    expect(typeof data.uptime).toBe('number')
  })
})
