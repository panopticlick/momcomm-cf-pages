import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { PostHero } from '@/components/frontend/post/post-hero'
import { PostContent } from '@/components/frontend/post/post-content'
import type { Post, Media } from '@/payload-types'
import { RelatedPosts } from '@/components/frontend/post/related-posts'
import { getRelatedPosts } from '@/services/posts/related-posts'
import { RelatedTopics } from '@/components/frontend/topic/related-topics'
import { getRelatedTopics } from '@/services/topics/related-topics'
import type { TopicWithImage } from '@/components/frontend/node-topics'
import { processShortcodesWithId } from '@/services/shortcode/process'
import { Metadata } from 'next'
import { siteConfig } from '@/lib/site-config'
import { getPostSiloPath, resolvePostSilo } from '@/services/momcomm/post-routing'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const { slug } = await params
  const { preview } = await searchParams
  const payload = await getPayloadClient()

  const where: any = {
    slug: {
      equals: slug,
    },
  }

  if (preview === 'true') {
    where.status = {
      in: ['draft', 'published'],
    }
  } else {
    where.status = {
      equals: 'published',
    }
  }

  const postQuery = await payload.find({
    collection: 'posts',
    where,
    limit: 1,
    depth: 1,
  })

  if (!postQuery.docs.length) {
    return {
      title: 'Post Not Found',
    }
  }

  const post = postQuery.docs[0] as unknown as Post
  const title = post.meta_title || post.title
  const description = post.meta_description || post.excerpt || `Read ${post.title}`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  const resolvedSilo = resolvePostSilo(post)
  const siloPath = getPostSiloPath(resolvedSilo, post.slug)
  const url = `${siteUrl}${siloPath || `/post/${post.slug}`}`

  let image: string | undefined
  if (
    post.featured_media &&
    typeof post.featured_media === 'object' &&
    'url' in post.featured_media
  ) {
    const media = post.featured_media as Media
    image = media.url || undefined
  }

  const images = image ? [{ url: image }] : []

  const authors =
    post.authors
      ?.map((author) => {
        if (typeof author === 'object' && 'name' in author) return author.name
        return ''
      })
      .filter((name): name is string => !!name) || []

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: 'en_US',
      type: 'article',
      publishedTime: post.published_at || post.createdAt,
      authors: authors,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const { preview } = await searchParams
  const payload = await getPayloadClient()

  const where: any = {
    slug: {
      equals: slug,
    },
  }

  if (preview === 'true') {
    where.status = {
      in: ['draft', 'published'],
    }
  } else {
    where.status = {
      equals: 'published',
    }
  }

  const postQuery = await payload.find({
    collection: 'posts',
    where,
    limit: 1,
    depth: 2,
  })

  if (!postQuery.docs.length) {
    notFound()
  }

  const post = postQuery.docs[0] as unknown as Post
  const resolvedSilo = resolvePostSilo(post)
  const siloPath = getPostSiloPath(resolvedSilo, post.slug)

  if (preview !== 'true' && resolvedSilo && siloPath) {
    redirect(siloPath)
  }

  // Pre-process shortcodes server-side and inject ID
  const { content: enrichedContent, dataMap: shortcodeData } = await processShortcodesWithId(
    post.content,
    {
      excludeSlug: slug,
    },
  )

  let relatedPosts: Post[] = []
  let relatedTopics: TopicWithImage[] = []
  const tags = post.tags

  if (tags && tags.length > 0) {
    const tagIds = tags
      .map((tag) => {
        if (typeof tag === 'object' && tag !== null && 'id' in tag) return tag.id
        if (typeof tag === 'string' || typeof tag === 'number') return tag
        return null
      })
      .filter((id) => id !== null)

    if (tagIds.length > 0) {
      relatedPosts = await getRelatedPosts({
        payload,
        currentPostId: post.id,
        tagIds: tagIds as (string | number)[],
        limit: 6,
      })

      relatedTopics = await getRelatedTopics({
        payload,
        tagIds: tagIds as (string | number)[],
        limit: 6,
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PostHero post={post} />
      <PostContent content={enrichedContent} shortcodeData={shortcodeData} />
      {relatedTopics.length > 0 && (
        <div className="container max-w-5xl mx-auto px-4 mb-12">
          <RelatedTopics
            topics={relatedTopics}
            title="Related Buying Guide"
            subtitle="Expert guides and top product recommendations"
          />
        </div>
      )}
      {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}
    </div>
  )
}
