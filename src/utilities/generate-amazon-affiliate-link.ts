import { siteConfig } from '@/lib/site-config'

export const generateAmazonAffiliateLink = (asin: string, tag?: string): string => {
  const affiliateTag = tag || siteConfig.amazonAffiliateTag

  const baseUrl = `https://www.amazon.com/dp/${asin}`

  if (!affiliateTag) {
    return baseUrl
  }

  return `${baseUrl}?tag=${affiliateTag}&th=1`
}
