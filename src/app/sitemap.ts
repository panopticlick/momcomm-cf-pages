import { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { siteConfig } from '@/lib/site-config'
import { getPostSiloPath, resolvePostSilo } from '@/services/momcomm/post-routing'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()

  // Base URL
  const baseUrl = siteConfig.url

  // Static routes
  const staticPaths = [
    '',
    '/gear',
    '/gear/reviews',
    '/gear/matrix',
    '/gear/drops',
    '/stack',
    '/stack/directory',
    '/stack/workflows',
    '/ventures',
    '/ventures/blueprints',
    '/ventures/build-in-public',
    '/ventures/toolkit',
    '/library',
    '/library/downloads',
    '/library/newsletter',
    '/meta/about',
    '/meta/legal',
    '/meta/search',
  ]

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.6,
  }))

  // Fetched nodes
  let dynamicRoutes: MetadataRoute.Sitemap = []

  try {
    const topics = await payload.find({
      collection: 'topics',
      limit: 1000,
      pagination: false,
      where: {
        active: {
          equals: true,
        },
      },
      sort: '-updatedAt',
    })

    const posts = await payload.find({
      collection: 'posts',
      limit: 1000,
      pagination: false,
      where: {
        status: {
          equals: 'published',
        },
      },
      depth: 1,
      sort: '-updatedAt',
    })

    const brands = await payload.find({
      collection: 'brands',
      limit: 1000,
      pagination: false,
      where: {
        slug: {
          exists: true,
        },
      },
      sort: '-weight_score_sum',
    })

    const products = await payload.find({
      collection: 'products',
      limit: 1000,
      pagination: false,
      where: {
        asin: {
          exists: true,
        },
        active: { equals: true },
      },
      sort: '-updatedAt',
    })

    // Map nodes to sitemap
    dynamicRoutes = [
      ...topics.docs.map((topic) => ({
        url: `${baseUrl}/gear/${topic.slug}`,
        lastModified: new Date(topic.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      })),
      ...posts.docs.flatMap((post) => {
        const resolvedSilo = resolvePostSilo(post)
        const path = getPostSiloPath(resolvedSilo, post.slug)

        if (!path) return []

        return [
          {
            url: `${baseUrl}${path}`,
            lastModified: new Date(post.updatedAt),
            changeFrequency: 'weekly' as const,
            priority: resolvedSilo === 'library' ? 0.6 : 0.7,
          },
        ]
      }),
      ...brands.docs.map((brand) => ({
        url: `${baseUrl}/brand/${brand.slug}`,
        lastModified: new Date(brand.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...products.docs.map((product) => ({
        url: `${baseUrl}/p/${product.asin}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ]
  } catch (error) {
    console.error('Error generating sitemap:', error)
  }

  return [...staticRoutes, ...dynamicRoutes]
}
