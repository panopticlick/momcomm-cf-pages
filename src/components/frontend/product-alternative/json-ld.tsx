import { ProductAlternativesData } from '@/services/products/get-product-alternatives'
import { getFullUrl, siteConfig } from '@/lib/site-config'

interface ProductAlternativeJsonLdProps {
  data: ProductAlternativesData
}

export function ProductAlternativeJsonLd({ data }: ProductAlternativeJsonLdProps) {
  const { product, alternatives } = data
  const url = getFullUrl(`/p/${product.asin}`)

  // Extract price and availability from PAAPI5 data
  const paapi5 = product.paapi5
  const offers = paapi5?.Offers?.Listings?.[0]

  const getPrice = () => {
    if (offers?.Price?.Display) {
      return offers.Price.Display
    }
    if (offers?.Price?.Amount && offers?.Price?.Currency) {
      return `${offers.Price.Currency} ${offers.Price.Amount}`
    }
    return undefined
  }

  const getAvailability = () => {
    const availability = offers?.Availability?.Message
    if (availability && availability.toLowerCase().includes('available')) {
      return 'https://schema.org/InStock'
    }
    return 'https://schema.org/OutOfStock'
  }

  const getRating = () => {
    const rating = paapi5?.Offers?.Listings?.[0]?.Rating
    if (rating?.Value) {
      return {
        '@type': 'AggregateRating',
        ratingValue: rating.Value,
        reviewCount: rating.Count || 0,
        bestRating: '5',
        worstRating: '1',
      }
    }
    return undefined
  }

  const mainProductSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.image ? [product.image] : undefined,
    description: `Discover best alternatives for ${product.title}. Find top-rated similar products and related shopping needs.`,
    brand: product.brand
      ? {
          '@type': 'Brand',
          name: product.brand.name,
        }
      : undefined,
    url: url,
    sku: product.asin,
    offers: {
      '@type': 'Offer',
      url: getFullUrl(`/go/${product.asin}`),
      priceCurrency: offers?.Price?.Currency || 'USD',
      price: offers?.Price?.Amount || undefined,
      availability: getAvailability(),
      condition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Amazon',
      },
      affiliateOf: {
        '@type': 'Organization',
        name: siteConfig.name,
      },
    },
    aggregateRating: getRating(),
    // Add alternatives as related relations
    isSimilarTo: alternatives.map((alt) => ({
      '@type': 'Product',
      name: alt.title,
      image: alt.image,
      url: getFullUrl(`/p/${alt.asin}`),
      brand: alt.brand
        ? {
            '@type': 'Brand',
            name: alt.brand.name,
          }
        : undefined,
    })),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: getFullUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Alternatives',
        item: url,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title,
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify([mainProductSchema, breadcrumbSchema]),
      }}
    />
  )
}
