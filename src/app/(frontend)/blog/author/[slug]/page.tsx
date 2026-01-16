import React from 'react'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { AuthorHero } from '@/components/frontend/blog/author-hero'
import { PostList } from '@/components/frontend/blog/post-list'
import type { Post, User } from '@/payload-types'
import { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadClient()

  const authorQuery = await payload.find({
    collection: 'users',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  })

  if (!authorQuery.docs.length) {
    return {
      title: 'Author Not Found',
    }
  }

  const author = authorQuery.docs[0]
  return {
    title: `${author.name} - Author | Blog`,
    description: (author as any).bio || `Read articles by ${author.name}`,
  }
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayloadClient()

  // Fetch Author
  const authorQuery = await payload.find({
    collection: 'users',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  })

  if (!authorQuery.docs.length) {
    notFound()
  }

  const author = authorQuery.docs[0] as unknown as User

  // Fetch Posts by Author
  const postsQuery = await payload.find({
    collection: 'posts',
    where: {
      authors: {
        equals: author.id,
      },
      status: {
        equals: 'published',
      },
    },
    sort: '-published_at',
    depth: 2,
  })

  const posts = postsQuery.docs as unknown as Post[]

  return (
    <div className="flex flex-col min-h-screen">
      <AuthorHero author={author} />
      <div className="container px-4 md:px-6 mx-auto py-12 md:py-16">
        <h2 className="text-2xl font-bold mb-8 pb-4 border-b border-border/50">
          Latest Posts by {author.name}
        </h2>
        <PostList posts={posts} />
      </div>
    </div>
  )
}
