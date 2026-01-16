import React from 'react'
import { getPayloadClient } from '@/lib/payload'
import { BlogHero } from '@/components/frontend/blog/blog-hero'
import { PostList } from '@/components/frontend/blog/post-list'
import type { Post } from '@/payload-types'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MomComm Blog | Insights & Updates',
  description: 'MomComm insights, guides, and updates for modern moms.',
}

export default async function BlogPage() {
  const payload = await getPayloadClient()

  const postsQuery = await payload.find({
    collection: 'posts',
    sort: '-published_at',
    where: {
      status: {
        equals: 'published',
      },
    },
    depth: 2,
    limit: 12,
  })

  const posts = postsQuery.docs as unknown as Post[]

  return (
    <div className="flex flex-col min-h-screen">
      <BlogHero />
      <div className="container px-4 md:px-6 mx-auto py-12 md:py-16">
        <PostList posts={posts} />
      </div>
    </div>
  )
}
