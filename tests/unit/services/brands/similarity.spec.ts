import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSimilarBrandsByTopics } from '@/services/brands/similarity'
import { getPayload } from 'payload'

// Mock payload
vi.mock('payload', () => ({
  getPayload: vi.fn(),
  buildConfig: vi.fn((config) => config),
}))

// Mock ranking service
vi.mock('@/services/brands/ranking', () => ({
  getBrandRankingsByIds: vi.fn(),
}))
// Import mocked function
import { getBrandRankingsByIds } from '@/services/brands/ranking'

describe('getSimilarBrandsByTopics', () => {
  let mockExecute: any
  let mockFind: any

  beforeEach(() => {
    vi.resetAllMocks()

    mockExecute = vi.fn()
    mockFind = vi.fn()

    // Mock getPayload implementation
    ;(getPayload as any).mockResolvedValue({
      db: {
        drizzle: {
          execute: mockExecute,
        },
      },
      find: mockFind,
    })
  })

  // ... (keep first test same)
  it('should return empty array if target brand is not found', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] })
    const result = await getSimilarBrandsByTopics('unknown-brand')
    expect(result).toEqual([])
    expect(mockExecute).toHaveBeenCalledTimes(1)
  })

  it('should return similar brands correctly with ranking', async () => {
    // 1. Mock first DB call (get brand id)
    mockExecute.mockResolvedValueOnce({ rows: [{ id: 100 }] })

    // 2. Mock second DB call (find similar brands)
    mockExecute.mockResolvedValueOnce({
      rows: [
        { brand_id: 200, common_count: 5 },
        { brand_id: 300, common_count: 3 },
      ],
    })

    // 3. Mock payload.find (fetch brand details)
    mockFind.mockResolvedValueOnce({
      docs: [
        { id: 200, slug: 'brand-a', name: 'Brand A' },
        { id: 300, slug: 'brand-b', name: 'Brand B' },
      ],
    })

    // 4. Mock getBrandRankingsByIds
    ;(getBrandRankingsByIds as any).mockResolvedValueOnce([
      { id: 200, rank: 10 },
      { id: 300, rank: 20 },
    ])

    const result = await getSimilarBrandsByTopics('target-brand')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 200,
      slug: 'brand-a',
      name: 'Brand A',
      commonTopicCount: 5,
      rank: 10,
    })
    expect(result[1]).toEqual({
      id: 300,
      slug: 'brand-b',
      name: 'Brand B',
      commonTopicCount: 3,
      rank: 20,
    })

    // Verify calls
    expect(mockExecute).toHaveBeenCalledTimes(2)
    expect(getBrandRankingsByIds).toHaveBeenCalledWith([200, 300])
  })

  it('should handle case when no similar brands found', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [{ id: 100 }] })
    mockExecute.mockResolvedValueOnce({ rows: [] })
    const result = await getSimilarBrandsByTopics('target-brand')
    expect(result).toEqual([])
    expect(mockFind).not.toHaveBeenCalled()
  })
})
