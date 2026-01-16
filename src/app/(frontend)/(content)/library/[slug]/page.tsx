import React from 'react'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { PostHero } from '@/components/frontend/post/post-hero'
import { PostContent } from '@/components/frontend/post/post-content'
import { Button } from '@/components/ui/button'
import { processShortcodesWithId } from '@/services/shortcode/process'
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
    return { title: 'Resource' }
  }

  const post = postQuery.docs[0] as Post
  const resolvedSilo = resolvePostSilo(post)
  const canonicalPath = getPostSiloPath(resolvedSilo, post.slug) || `/library/${post.slug}`
  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || `Download ${post.title}`,
    alternates: {
      canonical: getFullUrl(canonicalPath),
    },
  }
}

export default async function LibraryDownloadPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
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

  if (!postQuery.docs.length) {
    notFound()
  }

  const post = postQuery.docs[0] as Post
  const resolvedSilo = resolvePostSilo(post)
  const canonicalPath = getPostSiloPath(resolvedSilo, post.slug)

  if (resolvedSilo && resolvedSilo !== 'library' && canonicalPath) {
    redirect(canonicalPath)
  }
  const { content: enrichedContent, dataMap: shortcodeData } = await processShortcodesWithId(
    post.content,
    { excludeSlug: slug },
  )

  const downloadUrl = (post as any).download_url || (post as any).external_url

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PostHero post={post} backHref="/library/downloads" backLabel="Back to Downloads" />
      <div className="container max-w-5xl mx-auto px-4 pb-8">
        {downloadUrl && (
          <Button asChild className="rounded-full">
            <a href={downloadUrl} target="_blank" rel="noreferrer">
              Download now
            </a>
          </Button>
        )}
      </div>
      <PostContent content={enrichedContent} shortcodeData={shortcodeData} />
    </div>
  )
}
