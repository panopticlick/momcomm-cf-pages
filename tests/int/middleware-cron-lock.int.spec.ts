import { describe, it, expect, beforeEach, vi } from 'vitest'
import { acquireCronLock, withCronLock } from '@/middleware/cron-lock'
import { NextResponse } from 'next/server'

// Mock Redis
vi.mock('@/lib/redis', () => ({
  redis: {
    set: vi.fn(),
    del: vi.fn(),
  },
}))

import { redis } from '@/lib/redis'

describe('Cron Lock Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should acquire lock when available', async () => {
    vi.mocked(redis.set).mockResolvedValue('OK')

    const request = new Request('https://example.com/api/cron/test')
    const result = await acquireCronLock(request, {
      lockKey: 'cron:test:lock',
    })

    expect(result.success).toBe(true)
    expect(result.lock).toBeDefined()
    expect(result.lock?.release).toBeDefined()
    expect(redis.set).toHaveBeenCalledWith('cron:test:lock', 'locked', 'EX', 300, 'NX')
  })

  it('should fail to acquire lock when already held', async () => {
    vi.mocked(redis.set).mockResolvedValue(null)

    const request = new Request('https://example.com/api/cron/test')
    const result = await acquireCronLock(request, {
      lockKey: 'cron:test:lock',
    })

    expect(result.success).toBe(false)
    expect(result.response).toBeInstanceOf(NextResponse)
    expect(result.lock).toBeUndefined()

    const response = await result.response!.json()
    expect(response.success).toBe(false)
    expect(response.message).toBe('Job already running')

    expect(result.response!.status).toBe(429)
  })

  it('should bypass lock with force parameter', async () => {
    vi.mocked(redis.del).mockResolvedValue(1)
    vi.mocked(redis.set).mockResolvedValue('OK')

    const request = new Request('https://example.com/api/cron/test?force=true')
    const result = await acquireCronLock(request, {
      lockKey: 'cron:test:lock',
    })

    expect(result.success).toBe(true)
    expect(redis.del).toHaveBeenCalledWith('cron:test:lock')
    expect(redis.set).toHaveBeenCalledWith('cron:test:lock', 'locked', 'EX', 300, 'NX')
  })

  it('should use custom lock duration', async () => {
    vi.mocked(redis.set).mockResolvedValue('OK')

    const request = new Request('https://example.com/api/cron/test')
    const result = await acquireCronLock(request, {
      lockKey: 'cron:test:lock',
      lockDuration: 120,
    })

    expect(result.success).toBe(true)
    expect(redis.set).toHaveBeenCalledWith('cron:test:lock', 'locked', 'EX', 120, 'NX')
  })

  it('should release lock when handler completes', async () => {
    vi.mocked(redis.set).mockResolvedValue('OK')
    vi.mocked(redis.del).mockResolvedValue(1)

    const request = new Request('https://example.com/api/cron/test')
    let released = false

    const result = await acquireCronLock(request, {
      lockKey: 'cron:test:lock',
    })

    if (result.lock) {
      await result.lock.release()
      released = true
    }

    expect(released).toBe(true)
    expect(redis.del).toHaveBeenCalledWith('cron:test:lock')
  })

  it('should use withCronLock wrapper correctly', async () => {
    vi.mocked(redis.set).mockResolvedValue('OK')
    vi.mocked(redis.del).mockResolvedValue(1)

    const request = new Request('https://example.com/api/cron/test')
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ done: true }))

    const response = await withCronLock(request, { lockKey: 'cron:test:lock' }, handler)

    expect(handler).toHaveBeenCalled()
    expect(redis.del).toHaveBeenCalled()
    expect(await response.json()).toEqual({ done: true })
  })

  it('should return locked response without executing handler', async () => {
    vi.mocked(redis.set).mockResolvedValue(null)

    const request = new Request('https://example.com/api/cron/test')
    const handler = vi.fn()

    const response = await withCronLock(request, { lockKey: 'cron:test:lock' }, handler)

    expect(handler).not.toHaveBeenCalled()
    expect(response.status).toBe(429)
    expect(await response.json()).toEqual({
      success: false,
      message: 'Job already running',
    })
  })

  it('should release lock even when handler throws', async () => {
    vi.mocked(redis.set).mockResolvedValue('OK')
    vi.mocked(redis.del).mockResolvedValue(1)

    const request = new Request('https://example.com/api/cron/test')
    const handler = vi.fn().mockRejectedValue(new Error('Handler error'))

    await expect(withCronLock(request, { lockKey: 'cron:test:lock' }, handler)).rejects.toThrow(
      'Handler error',
    )

    expect(redis.del).toHaveBeenCalledWith('cron:test:lock')
  })
})
