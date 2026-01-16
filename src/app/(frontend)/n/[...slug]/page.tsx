import React from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { siteConfig, getFullUrl } from '@/lib/site-config'

import { getPayloadClient } from '@/lib/payload'
import { NodeBreadcrumb } from '@/components/frontend/node-breadcrumb'
import { NodeHeader } from '@/components/frontend/node-header'
import { NodeChildren } from '@/components/frontend/node-children'
import { NodeTopics, type TopicWithImage } from '@/components/frontend/node-topics'
import { Pagination } from '@/components/frontend/pagination'
import { sql } from '@payloadcms/db-postgres'
import type { User, Media } from '@/payload-types'

export const dynamic = 'force-dynamic'

interface NodePageProps {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadClient()
  const slugPath = slug.join('/')
  const parentSlugPath = slug.length > 1 ? slug.slice(0, -1).join('/') : null

  const slugsToFetch = [slugPath]
  if (parentSlugPath) {
    slugsToFetch.push(parentSlugPath)
  }

  const result = await payload.find({
    collection: 'nodes',
    where: {
      slug: {
        in: slugsToFetch,
      },
    },
  })

  const node = result.docs.find((n) => n.slug === slugPath)
  const parentNode = parentSlugPath ? result.docs.find((n) => n.slug === parentSlugPath) : null

  if (!node) {
    return {
      title: 'Section Not Found',
    }
  }

  const displayName = node.display_name
  const parentDisplayName = parentNode?.display_name

  // Construct title with parent context if available
  const titleText = parentDisplayName ? `${displayName} - ${parentDisplayName}` : displayName
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const title = (node as any).meta_title || `${titleText} - Top Recommended Products`
  const description =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node as any).meta_description ||
    `Explore our curated selection of top-rated ${displayName}${parentDisplayName ? ` in ${parentDisplayName}` : ''}. Find detailed reviews, comparisons, and expert insights.`
  const canonicalUrl = getFullUrl(`/n/${slugPath}`)

  // Fetch authors from top topics
  const nodeTopicsQuery = await payload.find({
    collection: 'node-topics',
    where: {
      and: [
        {
          node: {
            equals: node.id,
          },
        },
        {
          'topic.active': {
            equals: true,
          },
        },
        {
          'topic.authors': {
            exists: true,
          },
        },
      ],
    },
    limit: 5, // Check top 5 topics for authors
    depth: 2,
    sort: '-topic.conversion_share_sum',
  })

  const authorsMap = new Map<string, { name: string; url?: string }>()

  nodeTopicsQuery.docs.forEach((doc) => {
    if (typeof doc.topic === 'object' && doc.topic !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const topic = doc.topic as any
      if (Array.isArray(topic.authors)) {
        topic.authors.forEach((author: any) => {
          if (typeof author === 'object' && author !== null && author.name) {
            authorsMap.set(author.id || author.name, {
              name: author.name,
              url: author.slug ? getFullUrl(`/author/${author.slug}`) : undefined,
            })
          }
        })
      }
    }
  })

  const authors = Array.from(authorsMap.values())

  return {
    title,
    description,
    keywords: [
      displayName,
      parentDisplayName,
      'Amazon',
      'products',
      'reviews',
      'best',
      'comparison',
    ].filter(Boolean) as string[],
    authors,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: `/og-image/t/${slug}`,
          width: 1200,
          height: 630,
          alt: title,
        },
        {
          url: `/og-image/t/${slug}/pin`,
          width: 1000,
          height: 1500,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function NodePage({ params, searchParams }: NodePageProps) {
  const { slug } = await params
  const { page } = await searchParams
  const slugPath = slug.join('/')

  // Construct all partial paths for breadcrumb fetching
  // e.g. ['desktops', 'all-in-ones'] -> ['desktops', 'desktops/all-in-ones']
  const intermediatePaths = slug.map((_, index) => slug.slice(0, index + 1).join('/'))

  const currentPage = Number(page) || 1
  const pageSize = 24

  const payload = await getPayloadClient()

  // 1. Fetch current Node and all intermediate nodes for breadcrumb
  const nodesQuery = await payload.find({
    collection: 'nodes',
    where: {
      slug: {
        in: intermediatePaths,
      },
    },
    limit: 10, // Should cover depth of breadcrumb
  })

  // Sort nodes by slug length to ensure correct order
  const breadcrumbNodes = nodesQuery.docs.sort((a, b) => a.slug.length - b.slug.length)

  const node = breadcrumbNodes.find((n) => n.slug === slugPath)

  if (!node) {
    return notFound()
  }

  // 2. Fetch Children
  const childrenQuery = await payload.find({
    collection: 'nodes',
    where: {
      parent: {
        equals: node.node_id,
      },
    },
    limit: 20, // Limit children display
  })

  // 3. Fetch Topics via NodeTopic -> Topic
  const nodeTopicsQuery = await payload.find({
    collection: 'node-topics',
    where: {
      and: [
        {
          node: {
            equals: node.id,
          },
        },
        {
          'topic.active': {
            equals: true,
          },
        },
      ],
    },
    limit: pageSize,
    page: currentPage,
    sort: '-topic.conversion_share_sum',
    depth: 3,
  })

  const rawTopics = nodeTopicsQuery.docs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((doc: any) => doc.topic)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((topic: any) => typeof topic === 'object' && topic !== null)

  // 4. 为每个 topic 联查 top1 产品图片
  const topicsWithImages: TopicWithImage[] = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rawTopics.map(async (topic: any) => {
      let imageUrl: string | null = null
      let productCount = 0

      // Map authors with avatar
      const authors = topic.authors
        ?.map((author: any) => {
          if (typeof author === 'object' && author !== null && 'name' in author) {
            const user = author as User
            let avatarUrl = null
            if (user.avatar && typeof user.avatar === 'object' && 'url' in user.avatar) {
              avatarUrl = (user.avatar as Media).url
            }

            return {
              id: user.id || 0,
              name: user.name,
              slug: user.slug,
              avatarUrl,
            }
          }
          return null
        })
        .filter((a: any) => a !== null)

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { rows } = await (payload.db as any).drizzle.execute(sql`
          SELECT
            p.image,
            p.paapi5,
            count(*) OVER() as total_count
          FROM aba_search_terms ast
          JOIN products p ON ast.asin = p.asin
          WHERE ast.keywords = ${topic.name}
            AND p.active = true
          ORDER BY ast.weighted_score DESC
          LIMIT 1
        `)

        if (rows.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = rows[0] as any
          const paapi = row.paapi5
          imageUrl =
            paapi?.Images?.Primary?.Medium?.URL ||
            paapi?.Images?.Primary?.Large?.URL ||
            row.image ||
            null

          productCount = Number(row.total_count || 0)
        }
      } catch (error) {
        console.error(`Error fetching image for topic ${topic.name}:`, error)
      }

      return {
        ...topic,
        imageUrl,
        productCount,
        authors,
      }
    }),
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-x-hidden selection:bg-primary/20">
      {/* Global Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-3xl animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="container relative z-10 px-4 md:px-6 py-12 md:py-20 mx-auto max-w-7xl animate-fade-in">
        <NodeBreadcrumb nodes={breadcrumbNodes} />
        <NodeHeader node={node} />
        <div className="space-y-12">
          <NodeChildren childrenNodes={childrenQuery.docs} />
          {topicsWithImages.length > 0 && (
            <NodeTopics topics={topicsWithImages} nodeId={node.node_id} />
          )}
          <Pagination currentPage={currentPage} totalPages={nodeTopicsQuery.totalPages} />
        </div>
      </div>
    </div>
  )
}
