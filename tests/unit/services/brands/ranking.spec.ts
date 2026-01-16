import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getBrandRankingsByIds } from '@/services/brands/ranking'
import { getPayload } from 'payload'

// Mock payload
vi.mock('payload', () => ({
  getPayload: vi.fn(),
  buildConfig: vi.fn((config) => config),
}))

describe('getBrandRankingsByIds', () => {
  let mockExecute: any

  beforeEach(() => {
    vi.resetAllMocks()

    mockExecute = vi.fn()

    // Mock getPayload implementation
    ;(getPayload as any).mockResolvedValue({
      db: {
        drizzle: {
          execute: mockExecute,
        },
      },
    })
  })

  it('should return empty array if ids are empty', async () => {
    const result = await getBrandRankingsByIds([])
    expect(result).toEqual([])
    expect(mockExecute).not.toHaveBeenCalled()
  })

  it('should return rankings for valid IDs', async () => {
    // Mock query - the one that returns sorted data
    const mockRows = [
      {
        rank: 1,
        id: 10,
        name: 'Brand A',
        slug: 'brand-a',
        weighted_score_sum: 100,
      },
      {
        rank: 5,
        id: 20,
        name: 'Brand B',
        slug: 'brand-b',
        weighted_score_sum: 50,
      },
    ]
    mockExecute.mockResolvedValueOnce({ rows: mockRows })

    const result = await getBrandRankingsByIds([10, 20])

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(10)
    expect(result[0].rank).toBe(1)
    expect(result[1].id).toBe(20)
    expect(result[1].rank).toBe(5)

    expect(mockExecute).toHaveBeenCalledTimes(1)
  })
})
