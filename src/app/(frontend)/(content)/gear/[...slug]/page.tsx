import React from 'react'
import { notFound, permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { siteConfig, getFullUrl } from '@/lib/site-config'
import { TopicBreadcrumb } from '@/components/frontend/topic/breadcrumb'
import { TopicHeader } from '@/components/frontend/topic/header'
import { TopicIntroductory, TopicMainContent } from '@/components/frontend/topic/content'
import { ProductList } from '@/components/frontend/topic/product-list'
import { TopicJsonLd } from '@/components/frontend/topic/json-ld'
import { TopicSidebar } from '@/components/frontend/topic/sidebar'
import { ComparisonTable } from '@/components/frontend/topic/comparison-table'
import { AuthorCard } from '@/components/frontend/author-card'
import { RelatedTopics } from '@/components/frontend/topic/related-topics'
import { getTopicPageData } from '@/services/topics/get-topic-page-data'
import type { MergedProduct } from '@/components/frontend/topic/product-card'
import type { User, Topic } from '@/payload-types'
import { processShortcodesWithId } from '@/services/shortcode/process'
import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { TopicPreviewCard } from '@/components/frontend/momcomm/topic-preview-card'
import { attachImagesToTopics } from '@/components/lib/topic-utils'

// Topic pages use ISR with 30-minute revalidation
export const revalidate = 1800

async function getTopicBySlug(slug: string) {
  const payload = await getPayloadClient()
  const topicQuery = await payload.find({
    collection: 'topics',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  return topicQuery.docs[0]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const slugPart = slug[slug.length - 1]

  const topic = await getTopicBySlug(slugPart)
  if (!topic) {
    return {
      title: 'Gear Category',
    }
  }

  const displayName = topic.display_name || topic.name
  const hasBestPrefix = /^best\b/i.test(displayName)

  const title =
    topic.meta_title || `${hasBestPrefix ? '' : 'Best '}${displayName} - MomComm Gear Review`
  const description =
    topic.meta_description ||
    `A MomComm review of ${displayName}. Compare top picks, see the pros and cons, and choose the best fit for your family.`

  const authors = topic.authors
    ?.map((author: any) => (author?.name ? { name: author.name } : null))
    .filter((a: any): a is { name: string } => a !== null)

  const canonicalUrl = getFullUrl(`/gear/${topic.slug}`)

  return {
    title,
    description,
    keywords: [topic.name, displayName, 'MomComm', 'reviews', 'gear'].filter(Boolean),
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
          url: `/og-image/t/${topic.slug}`,
          width: 1200,
          height: 630,
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

export default async function GearRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const { n } = await searchParams
  const nodeId = typeof n === 'string' ? n : undefined
  const slugPart = slug[slug.length - 1]

  const topic = await getTopicBySlug(slugPart)
  if (!topic) {
    const payload = await getPayloadClient()
    const tagQuery = await payload.find({
      collection: 'tags',
      where: { slug: { equals: slugPart } },
      limit: 1,
    })

    if (!tagQuery.docs.length) {
      return notFound()
    }

    const tag = tagQuery.docs[0]
    const topicsQuery = await payload.find({
      collection: 'topics',
      where: {
        active: { equals: true },
        tags: { in: [tag.id] },
      },
      limit: 24,
      depth: 1,
      sort: '-updatedAt',
    })
    const topicsWithImages = await attachImagesToTopics(payload, topicsQuery.docs as Topic[])

    return (
      <div className="min-h-screen">
        <section className="container mx-auto px-4 py-16">
          <SectionHeading
            kicker="Gear Category"
            title={`${tag.name} reviews`}
            subtitle="Curated gear reviews for this category."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {topicsWithImages.map((topicDoc) => (
              <TopicPreviewCard
                key={topicDoc.id}
                topic={topicDoc}
                href={`/gear/${topicDoc.slug}`}
              />
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (slug.length > 1 && slugPart !== topic.slug) {
    permanentRedirect(`/gear/${topic.slug}`)
  }

  const data = await getTopicPageData(topic.slug, nodeId)

  if (!data) {
    return notFound()
  }

  const { mergedProducts, relatedTopics, breadcrumbNodes, topBrands, dateRange } = data

  if (topic.redirect && topic.redirect_to) {
    permanentRedirect(topic.redirect_to)
  }

  const { content: enrichedIntroductory, dataMap: introductoryShortcodeData } =
    await processShortcodesWithId(topic.introductory, { excludeSlug: topic.slug })

  const { content: enrichedContent, dataMap: contentShortcodeData } = await processShortcodesWithId(
    topic.content,
    { excludeSlug: topic.slug },
  )

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <TopicJsonLd topic={topic} products={mergedProducts as MergedProduct[]} />

      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <TopicBreadcrumb
          topicName={topic.display_name || topic.name}
          nodes={breadcrumbNodes}
          root={{ label: 'Gear', href: '/gear' }}
        />
        <TopicHeader topic={topic} productCount={mergedProducts.length} />

        <TopicIntroductory
          introductory={enrichedIntroductory}
          shortcodeData={introductoryShortcodeData}
        />

        {mergedProducts.length > 1 && (
          <div className="mb-8">
            <ComparisonTable products={(mergedProducts as MergedProduct[]).slice(0, 5)} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <ProductList
              products={mergedProducts as MergedProduct[]}
              currentTopic={topic.name}
              excerpt={topic.excerpt}
            />

            <TopicMainContent content={enrichedContent} shortcodeData={contentShortcodeData} />

            {topic.authors && topic.authors.length > 0 && (
              <div className="mt-16 border-t pt-12">
                <h3 className="text-2xl font-bold mb-8">About the Author</h3>
                <div className="space-y-6">
                  {topic.authors.map((author: any) => (
                    <AuthorCard key={author.id} author={author as User} />
                  ))}
                </div>
              </div>
            )}

            {relatedTopics.length > 0 && <RelatedTopics topics={relatedTopics} />}
          </div>
          <div className="lg:col-span-1">
            <TopicSidebar
              topProducts={mergedProducts as MergedProduct[]}
              topBrands={topBrands}
              dateRange={dateRange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
