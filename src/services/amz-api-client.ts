export interface NodeSearchLastYearItem {
  asin: string
  node_id: string
  node_display_name: string
  node_context_free_name: string
  rank_count: number
  rank_avg: number
  rank_sum: number
  rank_min: number
  rank_max: number
  click_share_avg: number
  click_share_max: number
  click_share_sum: number
  conversion_share_avg: number
  conversion_share_max: number
  conversion_share_sum: number
  weighted_score_sum: number
  start_date: string
  end_date: string
}

export interface NodeSearchLastYearResponseItem {
  keywords: string
  same: string[]
  items: NodeSearchLastYearItem[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
}

export type PeriodType = 'daily' | 'weekly'
export type SortDirection = 'ASC' | 'DESC'

export interface GetNodesAsinWithKeywordsLastYearParams {
  node_ids: string[]
  keywords?: string[]
  period_type?: PeriodType
  sort_by?: string
  sort_direction?: SortDirection
  min_asin_count?: number
  limit?: number
  offset?: number
}

export interface AsinWithNodeItem {
  keywords: string
  asin: string
  node_ids: number[]
  rank_count: number
  rank_avg: number
  rank_sum: number
  rank_min: number
  rank_max: number
  click_share_avg: number
  click_share_max: number
  click_share_sum: number
  conversion_share_avg: number
  conversion_share_max: number
  conversion_share_sum: number
  weighted_score_sum: number
  start_date: string
  end_date: string
}

export type AsinsWithNodesSortBy =
  | 'rank_count'
  | 'click_share_sum'
  | 'conversion_share_sum'
  | 'weighted_score_sum'

export interface GetKeywordsAsinsWithNodesLastYearParams {
  keywords: string
  node_ids?: number[]
  period_type?: PeriodType
  sort_by?: AsinsWithNodesSortBy
  sort_direction?: SortDirection
  limit?: number
  offset?: number
}

export interface KeywordsOverviewResponse {
  keywords: string
  keywords_length: number
  total_occurrences: number
  daily_occurrences: number
  weekly_occurrences: number
  daily_best_rank: number
  daily_worst_rank: number
  daily_avg_rank: number
  weekly_best_rank: number
  weekly_worst_rank: number
  weekly_avg_rank: number
  max_click_share: number
  min_click_share: number
  avg_click_share: number
  sum_click_share: number
  max_conversion_share: number
  min_conversion_share: number
  avg_conversion_share: number
  sum_conversion_share: number
  avg_difficulty_index: number
  first_seen_date: string
  last_seen_date: string
}

export class AmzApiClient {
  private baseUrl = 'https://fastapi.amzapi.io'
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.AMZ_API_KEY || ''
    if (!this.apiKey) {
      console.warn('AmzApiClient: AMZ_API_KEY is not set')
    }
  }

  private async fetch<T>(path: string, searchParams: URLSearchParams): Promise<T> {
    const url = `${this.baseUrl}${path}?${searchParams.toString()}`
    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AmzApiClient Error [${response.status}]: ${errorText}`)
    }

    return response.json()
  }

  async getNodesAsinWithKeywordsLastYear(
    params: GetNodesAsinWithKeywordsLastYearParams,
  ): Promise<PaginatedResponse<NodeSearchLastYearResponseItem>> {
    const searchParams = new URLSearchParams()

    params.node_ids.forEach((id) => searchParams.append('node_ids', id))

    if (params.keywords) {
      params.keywords.forEach((k) => searchParams.append('keywords', k))
    }

    if (params.period_type) searchParams.append('period_type', params.period_type)
    if (params.sort_by) searchParams.append('sort_by', params.sort_by)
    if (params.sort_direction) searchParams.append('sort_direction', params.sort_direction)
    if (params.min_asin_count !== undefined)
      searchParams.append('min_asin_count', String(params.min_asin_count))
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit))
    if (params.offset !== undefined) searchParams.append('offset', String(params.offset))

    return this.fetch<PaginatedResponse<NodeSearchLastYearResponseItem>>(
      '/api/v2/nodes/asin-with-keywords-last-year',
      searchParams,
    )
  }

  async getKeywordsAsinsWithNodesLastYear(
    params: GetKeywordsAsinsWithNodesLastYearParams,
  ): Promise<PaginatedResponse<AsinWithNodeItem>> {
    const searchParams = new URLSearchParams()

    if (params.node_ids) {
      params.node_ids.forEach((id) => searchParams.append('node_ids', String(id)))
    }
    if (params.period_type) searchParams.append('period_type', params.period_type)
    if (params.sort_by) searchParams.append('sort_by', params.sort_by)
    if (params.sort_direction) searchParams.append('sort_direction', params.sort_direction)
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit))
    if (params.offset !== undefined) searchParams.append('offset', String(params.offset))

    return this.fetch<PaginatedResponse<AsinWithNodeItem>>(
      `/api/v2/keywords/${encodeURIComponent(params.keywords)}/asins-with-nodes-last-year`,
      searchParams,
    )
  }

  async getKeywordsOverview(keywords: string): Promise<KeywordsOverviewResponse> {
    const searchParams = new URLSearchParams()
    return this.fetch<KeywordsOverviewResponse>(
      `/api/v2/keywords/${encodeURIComponent(keywords)}/overview`,
      searchParams,
    )
  }
  async getKeywordsSuggestions(query: string, limit?: number): Promise<string[]> {
    const searchParams = new URLSearchParams()
    searchParams.append('query', query)
    if (limit !== undefined) {
      searchParams.append('limit', String(limit))
    }

    return this.fetch<string[]>('/api/v2/keywords/suggestions', searchParams)
  }
}
