'use client'

import React from 'react'
import { PostCard } from './post-card'
import type { Post } from '@/payload-types'

interface PostListProps {
  posts: Post[]
}

export function PostList({ posts }: PostListProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/30 rounded-lg">
        <p className="text-muted-foreground text-lg">No posts found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
