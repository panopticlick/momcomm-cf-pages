import RSS from 'rss'
import { getPayloadClient } from '@/lib/payload'
import { siteConfig } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayloadClient()

  const feed = new RSS({
    title: siteConfig.name,
    description: siteConfig.description,
    site_url: siteConfig.url,
    feed_url: `${siteConfig.url}/feed.xml`,
    language: 'en',
    pubDate: new Date(),
    copyright: `${new Date().getFullYear()} ${siteConfig.name}`,
  })

  try {
    const { docs: topics } = await payload.find({
      collection: 'topics',
      where: {
        active: {
          equals: true,
        },
      },
      sort: '-updatedAt',
      limit: 50,
      depth: 2,
    })

    topics.forEach((topic) => {
      const author =
        topic.authors &&
        Array.isArray(topic.authors) &&
        topic.authors.length > 0 &&
        typeof topic.authors[0] === 'object'
          ? (topic.authors[0] as any).name
          : siteConfig.name

      feed.item({
        title: topic.display_name || topic.name,
        description: topic.meta_description || topic.name,
        url: `${siteConfig.url}/gear/${topic.slug}`,
        date: topic.updatedAt,
        author: author,
        enclosure: {
          url: `${siteConfig.url}/og-image/t/${topic.slug}`,
          type: 'image/png',
        },
      })
    })

    return new Response(feed.xml({ indent: true }), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new Response('Error generating RSS feed', { status: 500 })
  }
}
