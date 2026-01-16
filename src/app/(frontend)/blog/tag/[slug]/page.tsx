import React from 'react'
import { getPayloadClient } from '@/lib/payload'
import { BlogHero } from '@/components/frontend/blog/blog-hero'
import { PostList } from '@/components/frontend/blog/post-list'
import type { Post, Tag } from '@/payload-types'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

// Helper to fetch tag by slug
async function getTagBySlug(slug: string) {
  const payload = await getPayloadClient()
  const tagQuery = await payload.find({
    collection: 'tags',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  })

  if (!tagQuery.docs.length) {
    return null
  }

  return tagQuery.docs[0] as unknown as Tag
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const tag = await getTagBySlug(slug)

  if (!tag) {
    return {
      title: 'Tag Not Found',
    }
  }

  return {
    title: `${tag.name} - Blog Posts | Insights`,
    description: `Read articles about ${tag.name}.`,
  }
}

export default async function BlogTagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tag = await getTagBySlug(slug)

  if (!tag) {
    notFound()
  }

  const payload = await getPayloadClient()

  const postsQuery = await payload.find({
    collection: 'posts',
    sort: '-published_at',
    where: {
      and: [
        {
          status: {
            equals: 'published',
          },
        },
        {
          'tags.slug': {
            equals: slug,
          },
        },
      ],
    },
    depth: 2,
    limit: 12,
  })

  const posts = postsQuery.docs as unknown as Post[]

  return (
    <div className="flex flex-col min-h-screen">
      {/* We can customize BlogHero to accept title/description or just use a simpler header */}
      <div className="relative border-b border-border/40 bg-muted/10">
        <div className="container px-4 md:px-6 mx-auto py-12 md:py-20 text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Posts tagged &quot;<span className="text-primary">{tag.name}</span>&quot;
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Explore our latest articles and insights about {tag.name}.
          </p>
        </div>
      </div>

      <div className="container px-4 md:px-6 mx-auto py-12 md:py-16">
        <PostList posts={posts} />
      </div>
    </div>
  )
}
