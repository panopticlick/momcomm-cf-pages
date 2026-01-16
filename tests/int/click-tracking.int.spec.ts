import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/(frontend)/go/[asin]/route'
import { NextRequest } from 'next/server'
import { trackClick } from '@/lib/db/clicks'

// Mock dependencies
vi.mock('@/lib/db/clicks', () => ({
  trackClick: vi.fn(),
}))

vi.mock('@/utilities/generate-amazon-affiliate-link', () => ({
  generateAmazonAffiliateLink: vi.fn((asin: string) => `https://www.amazon.com/dp/${asin}`),
}))

import { trackClick } from '@/lib/db/clicks'
import { generateAmazonAffiliateLink } from '@/utilities/generate-amazon-affiliate-link'

describe('Click Tracking (/go/[asin])', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to Amazon with affiliate link', async () => {
    vi.mocked(trackClick).mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/go/B08X', {
      headers: {
        'user-agent': 'test-agent',
        referer: 'http://localhost:3000',
      },
    })

    const response = await GET(request, {
      params: Promise.resolve({ asin: 'B08X' }),
    })

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://www.amazon.com/dp/B08X')
  })

  it('should track click with correct data', async () => {
    vi.mocked(trackClick).mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/go/B08X', {
      headers: {
        'user-agent': 'Mozilla/5.0',
        referer: 'http://example.com',
        'x-forwarded-for': '1.2.3.4',
      },
    })

    await GET(request, {
      params: Promise.resolve({ asin: 'B08X' }),
    })

    expect(trackClick).toHaveBeenCalledWith(
      expect.objectContaining({
        asin: 'B08X',
        timestamp: expect.any(Date),
        referrer: 'http://example.com',
        userAgent: 'Mozilla/5.0',
        ip: '1.2.3.4',
      }),
    )
  })

  it('should handle missing ASIN gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/go/')

    const response = await GET(request, {
      params: Promise.resolve({ asin: '' }),
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid ASIN format')
  })

  it('should reject empty ASIN', async () => {
    const request = new NextRequest('http://localhost:3000/go/')

    const response = await GET(request, {
      params: Promise.resolve({ asin: '' }),
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid ASIN format')
  })

  it('should accept valid ASIN formats', async () => {
    vi.mocked(trackClick).mockResolvedValue(undefined)

    const validAsins = ['B08X123ABC', 'B09Y', '1234567890', 'ASIN123']

    for (const asin of validAsins) {
      const request = new NextRequest(`http://localhost:3000/go/${asin}`)
      const response = await GET(request, {
        params: Promise.resolve({ asin }),
      })

      expect(response.status).toBe(302)
    }
  })

  it('should use x-real-ip header when x-forwarded-for is missing', async () => {
    vi.mocked(trackClick).mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/go/B08X', {
      headers: {
        'x-real-ip': '5.6.7.8',
      },
    })

    await GET(request, {
      params: Promise.resolve({ asin: 'B08X' }),
    })

    expect(trackClick).toHaveBeenCalledWith(
      expect.objectContaining({
        ip: '5.6.7.8',
      }),
    )
  })

  it('should not block redirect when tracking fails', async () => {
    vi.mocked(trackClick).mockRejectedValue(new Error('Database error'))

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const request = new NextRequest('http://localhost:3000/go/B08X')

    const response = await GET(request, {
      params: Promise.resolve({ asin: 'B08X' }),
    })

    expect(response.status).toBe(302)
    expect(trackClick).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith('Click tracking failed:', expect.any(Error))

    consoleErrorSpy.mockRestore()
  })

  it('should handle missing referrer and user agent', async () => {
    vi.mocked(trackClick).mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/go/B08X')

    await GET(request, {
      params: Promise.resolve({ asin: 'B08X' }),
    })

    expect(trackClick).toHaveBeenCalledWith(
      expect.objectContaining({
        referrer: null,
        userAgent: null,
      }),
    )
  })
})
