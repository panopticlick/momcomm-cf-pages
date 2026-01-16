/**
 * https://scraper.amzapi.io/api/docs/v2/
 *
 */

export class AmzScraperClient {
  private baseUrl = 'https://scraper.amzapi.io'
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.AMZ_SCRAPER_API_KEY || ''
    if (!this.apiKey) {
      console.warn('AmzScraperClient: API Key is not set')
    }
  }

  private async fetch<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AmzScraperClient Error [${response.status}]: ${errorText}`)
    }

    return response.json()
  }

  async getAsin(asin: string): Promise<AmzScraperProductResponse> {
    return this.fetch<AmzScraperProductResponse>(`/api/v2/asin/${asin}`)
  }
}

export interface AmzScraperProductResponse {
  status: string
  data: AmzScraperProductData
}

export interface AmzScraperProductData {
  title: string
  search_label?: string
  global_location?: string
  byline_info?: {
    label: string
    href: string
  }
  parent_asin?: string | null
  breadcrumb?: Array<{
    position: number
    name: string
    href: string
  }>
  top_brand?: {
    name: string
    items: Array<{
      label: string
      snippet: string
    }>
  }
  buy_box?: {
    new?: BuyBoxOffer
    used?: BuyBoxOffer
    sns?: BuyBoxOffer
    prime_savings?: BuyBoxOffer
    [key: string]: BuyBoxOffer | undefined
  }
  promo_price_block_message?: {
    new_accordion?: Array<{ link?: string; message: string }>
    sns_accordion?: Array<{ link?: string; message: string }>
  }
  zeitgeist_badge?: string | null
  best_seller_badge?: string | null
  delight_pricing_badge?: string | null
  amazon_choice_badge?: string | null
  deal_badge?: string | null
  new_release_badge?: {
    badge: string
    href: string
    category: string
  }
  price?: {
    savings_percentage?: string
    price?: string
    list_price?: string
  }
  climate_pledge_friendly_badge?: string | null
  coupon?: string | null
  bought_in_past_month?: number | null
  overview?: Array<{
    id: string
    name: string
    value: string
  }>
  feature_bullets?: string[]
  product_details?: Array<{
    name: string
    value: string
  }>
  best_sellers_ranks?: Array<{
    type: string
    rank: number
    name: string
    url: string
  }>
  average_reviews?: {
    stars: number
    ratings: number
  }
  product_information?: {
    type?: 'normal' | 'technical' | string
    details?: Array<{
      name: string
      value: string
      type?: string
    }>
    warranty_and_support?: string
  }
  images?: Array<{
    url: string
  }>
  top_reviews?: AmzScraperReview[]
  // Allow for other fields not yet explicitly defined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface AmzScraperReview {
  review_id: string
  profile_name: string
  profile_url?: string
  title?: string
  snippet: string
  format_strip?: string
  verified_purchase?: string
  helpfull?: string
}

export interface BuyBoxOffer {
  price?: string
  list_price?: string
  prime?: string
  delivery?: string
  stock?: string
  ships_from?: string
  sold_by?: string
  seller?: {
    type?: string
    id?: string
    name?: string
    href?: string
    is_amazon_fulfilled?: string
    reviews_stars?: number
    reviews_count?: number
  }
  returns?: string
  delivery_block_message?: {
    time?: string
    price?: string
    message?: string
  }
}
