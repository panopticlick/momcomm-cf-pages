import type { Product, ProductScraper } from '@/payload-types'
import type { MergedProduct } from '@/components/frontend/topic/product-card'
import { getPayloadClient } from '@/lib/payload'

export async function getMergedProductsByAsins(asins: string[]): Promise<MergedProduct[]> {
  if (!asins.length) return []
  const payload = await getPayloadClient()

  const productsResult = await payload.find({
    collection: 'products',
    where: {
      asin: { in: asins },
      active: { equals: true },
    },
    limit: asins.length,
  })

  const scrapersResult = await payload.find({
    collection: 'product-scrapers',
    where: {
      asin: { in: asins },
      active: { equals: true },
    },
    limit: asins.length,
  })

  const productMap = new Map<string, Product>()
  const scraperMap = new Map<string, ProductScraper>()

  productsResult.docs.forEach((product) => {
    if (product.asin) productMap.set(product.asin, product as Product)
  })
  scrapersResult.docs.forEach((scraper) => {
    if (scraper.asin) scraperMap.set(scraper.asin, scraper as ProductScraper)
  })

  return asins
    .map((asin) => {
      const product = productMap.get(asin)
      if (!product) return null
      const scraper = scraperMap.get(asin)
      return {
        asin,
        product,
        scraper,
        abaSearchTerms: [],
        score: 0,
      } as MergedProduct
    })
    .filter((item): item is MergedProduct => item !== null)
}

export async function getTopProducts(limit: number = 8): Promise<MergedProduct[]> {
  const payload = await getPayloadClient()

  const productsResult = await payload.find({
    collection: 'products',
    where: { active: { equals: true } },
    sort: '-conversion_share_sum',
    limit,
  })

  const asins = productsResult.docs.map((product) => product.asin).filter(Boolean) as string[]
  return getMergedProductsByAsins(asins)
}
