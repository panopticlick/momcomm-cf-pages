import React from 'react'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { PostHero } from '@/components/frontend/post/post-hero'
import { PostContent } from '@/components/frontend/post/post-content'
import { processShortcodesWithId } from '@/services/shortcode/process'
import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { PostPreviewCard } from '@/components/frontend/momcomm/post-preview-card'
import { Button } from '@/components/ui/button'
import { getFullUrl } from '@/lib/site-config'
import { getPostSiloPath, resolvePostSilo } from '@/services/momcomm/post-routing'
import type { Post } from '@/payload-types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadClient()

  const postQuery = await payload.find({
    collection: 'posts',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    limit: 1,
    depth: 1,
  })

  if (!postQuery.docs.length) {
    return {
      title: 'Venture Entry',
    }
  }

  const post = postQuery.docs[0] as Post
  const resolvedSilo = resolvePostSilo(post)
  const canonicalPath = getPostSiloPath(resolvedSilo, post.slug) || `/ventures/${post.slug}`
  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || `Read ${post.title}`,
    alternates: {
      canonical: getFullUrl(canonicalPath),
    },
  }
}

export default async function VentureEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const postQuery = await payload.find({
    collection: 'posts',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    limit: 1,
    depth: 2,
  })

  if (postQuery.docs.length) {
    const post = postQuery.docs[0] as Post
    const resolvedSilo = resolvePostSilo(post)
    const canonicalPath = getPostSiloPath(resolvedSilo, post.slug)

    if (resolvedSilo && resolvedSilo !== 'ventures' && canonicalPath) {
      redirect(canonicalPath)
    }

    const { content: enrichedContent, dataMap: shortcodeData } = await processShortcodesWithId(
      post.content,
      { excludeSlug: slug },
    )
    const externalUrl = (post as any).external_url

    return (
      <div className="flex flex-col min-h-screen bg-background">
        <PostHero post={post} backHref="/ventures" backLabel="Back to Ventures" />
        {externalUrl && (
          <div className="container max-w-5xl mx-auto px-4 pb-6">
            <Button asChild className="rounded-full">
              <a href={externalUrl} target="_blank" rel="noreferrer">
                Open resource
              </a>
            </Button>
          </div>
        )}
        <PostContent content={enrichedContent} shortcodeData={shortcodeData} />
      </div>
    )
  }

  const tagQuery = await payload.find({
    collection: 'tags',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
  })

  if (!tagQuery.docs.length) {
    notFound()
  }

  const tag = tagQuery.docs[0]
  const taggedPosts = await payload.find({
    collection: 'posts',
    where: {
      tags: { in: [tag.id] },
      status: { equals: 'published' },
    },
    limit: 24,
    depth: 1,
  })

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          kicker="Ventures Tag"
          title={`${tag.name} venture notes`}
          subtitle="Curated venture entries tagged for this theme."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {taggedPosts.docs.map((post) => (
            <PostPreviewCard
              key={post.id}
              post={post as Post}
              href={`/ventures/${post.slug}`}
              label={tag.name}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
