import type { MergedProduct } from '@/components/frontend/topic/product-card'

/**
 * Generates a natural language summary for a topic based on its products.
 *
 * @param products List of merged products
 * @param topicName Name of the topic
 * @returns A summary string
 */
export function generateTopicSummary(products: MergedProduct[], topicName: string): string {
  if (!products || products.length === 0) {
    return `Discover the best ${topicName} products on Amazon. Explore top-rated options with detailed reviews.`
  }

  const uniqueProducts = products.length

  // Calculate stats
  const brands = new Map<string, number>()
  let highestRatedProduct: MergedProduct | null = null

  for (const p of products) {
    // Count brands
    const brandName =
      (p.product?.paapi5 as any)?.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ||
      (p.product?.paapi5 as any)?.ItemInfo?.ByLineInfo?.Manufacturer?.DisplayValue ||
      (p.scraper?.scraperMetadata as any)?.brand ||
      'Generic'

    if (brandName && brandName !== 'Generic' && brandName !== 'Other') {
      brands.set(brandName, (brands.get(brandName) || 0) + 1)
    }

    // Find highest rated
    if (!highestRatedProduct || (p.score || 0) > (highestRatedProduct.score || 0)) {
      highestRatedProduct = p
    }
  }

  // Get top 3 brands
  const topBrands = Array.from(brands.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)

  // Construct summary parts
  const intro = `A comprehensive comparison of the ${uniqueProducts} best ${topicName} products.`

  let brandPart = ''
  if (topBrands.length > 0) {
    if (topBrands.length === 1) {
      brandPart = ` The most popular brand in this category is ${topBrands[0]}.`
    } else {
      const lastBrand = topBrands.pop()
      brandPart = ` Top brands include ${topBrands.join(', ')} and ${lastBrand}.`
    }
  }

  let ratingPart = ''
  if (highestRatedProduct) {
    const p = highestRatedProduct
    const paapi = p.product?.paapi5 as any
    const scraperMeta = p.scraper?.scraperMetadata as any

    const productName =
      paapi?.ItemInfo?.Title?.DisplayValue || scraperMeta?.title || `Product ${p.asin}`
    // Truncate product name if too long
    const shortName = productName.length > 60 ? productName.substring(0, 60) + '...' : productName
    ratingPart = ` Based on our analysis, the highly-rated option is ${shortName}.`
  }

  return `${intro}${brandPart}${ratingPart} These rankings are based on real-world performance, user reviews, and value for money.`
}
