/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'amazon-paapi' {
  export interface CommonParameters {
    AccessKey: string
    SecretKey: string
    PartnerTag: string
    PartnerType?: string
    Marketplace?: string
  }

  export interface SearchItemsParameters {
    Keywords?: string
    Actor?: string
    Artist?: string
    Author?: string
    Brand?: string
    BrowseNodeId?: string
    Condition?: 'Any' | 'New' | 'Used' | 'Collectible' | 'Refurbished'
    CurrencyOfPreference?: string
    DeliveryFlags?: string[]
    ItemCount?: number
    ItemPage?: number
    LanguagesOfPreference?: string[]
    MaxPrice?: number
    MinPrice?: number
    MinReviewsRating?: number
    MinSavingPercent?: number
    OfferCount?: number
    Properties?: Record<string, string>
    Resources?: string[]
    SearchIndex?: string
    SortBy?: string
    Title?: string
    [key: string]: any
  }

  export interface GetItemsParameters {
    ItemIds: string[]
    Condition?: 'Any' | 'New' | 'Used' | 'Collectible' | 'Refurbished'
    CurrencyOfPreference?: string
    LanguagesOfPreference?: string[]
    Merchant?: string
    OfferCount?: number
    Resources?: string[]
    [key: string]: any
  }

  export interface GetBrowseNodesParameters {
    BrowseNodeIds: string[]
    LanguagesOfPreference?: string[]
    Resources?: string[]
    [key: string]: any
  }

  export interface GetVariationsParameters {
    ASIN: string
    Condition?: 'Any' | 'New' | 'Used' | 'Collectible' | 'Refurbished'
    CurrencyOfPreference?: string
    LanguagesOfPreference?: string[]
    Merchant?: string
    OfferCount?: number
    Resources?: string[]
    [key: string]: any
  }
}
