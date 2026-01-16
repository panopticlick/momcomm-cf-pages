import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AmzApiClient } from '@/services/amz-api-client'

describe('AmzApiClient', () => {
  let client: AmzApiClient

  beforeEach(() => {
    client = new AmzApiClient('test-key')
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('getKeywordsOverview calls the correct endpoint and returns data', async () => {
    const mockResponse = {
      keywords: 'wireless headphones',
      keywords_length: 19,
      total_occurrences: 655,
      daily_occurrences: 560,
      weekly_occurrences: 95,
      daily_best_rank: 398,
      daily_worst_rank: 1949,
      daily_avg_rank: 1032,
      weekly_best_rank: 530,
      weekly_worst_rank: 1596,
      weekly_avg_rank: 973,
      max_click_share: 10.74,
      min_click_share: 4.38,
      avg_click_share: 7.3,
      sum_click_share: 4866.14,
      max_conversion_share: 7.98,
      min_conversion_share: 0.99,
      avg_conversion_share: 4.02,
      sum_conversion_share: 2680.42,
      avg_difficulty_index: 0.42083537404580157,
      first_seen_date: '2024-02-24',
      last_seen_date: '2025-12-28',
    }

    const fetchMock = global.fetch as any
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await client.getKeywordsOverview('wireless headphones')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/keywords/wireless%20headphones/overview'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-API-Key': 'test-key',
        }),
      }),
    )
    expect(result).toEqual(mockResponse)
  })
  it('getKeywordsSuggestions calls the correct endpoint and returns string array', async () => {
    const mockResponse = ['suggestion1', 'suggestion2']
    const fetchMock = global.fetch as any
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await client.getKeywordsSuggestions('touchscreen', 10)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/keywords/suggestions?query=touchscreen&limit=10'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-API-Key': 'test-key',
        }),
      }),
    )
    expect(result).toEqual(mockResponse)
  })
})
