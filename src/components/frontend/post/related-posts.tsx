import React from 'react'
import { Post } from '@/payload-types'
import { PostCard } from '@/components/frontend/blog/post-card'

interface RelatedPostsProps {
  posts: Post[]
  title?: string
  subtitle?: string
  titleTag?: 'h2' | 'h3'
}

export const RelatedPosts = ({
  posts,
  title = 'Related Posts',
  subtitle,
  titleTag: TitleTag = 'h2',
}: RelatedPostsProps) => {
  if (!posts || posts.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-gray-50 dark:bg-zinc-900/50">
      <div className="container mx-auto px-4">
        <TitleTag className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100">
          {title}
        </TitleTag>
        {subtitle && (
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">{subtitle}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}
