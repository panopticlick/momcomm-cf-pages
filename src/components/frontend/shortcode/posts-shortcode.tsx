'use client'

import React from 'react'
import { ShortcodeArgs } from '@/services/shortcode'
import { PostsRow } from '@/components/frontend/post/posts-row'
import type { Post } from '@/payload-types'

interface PostsShortcodeProps {
  args: ShortcodeArgs
  preloadedPosts?: Post[]
}

export function PostsShortcode({ args, preloadedPosts }: PostsShortcodeProps) {
  // If no preloaded data, render nothing (server-side rendering expected)
  if (!preloadedPosts || preloadedPosts.length === 0) {
    return null
  }

  const title = args.h2 || args.h3 || 'Related Posts'
  const titleTag = args.h3 && !args.h2 ? 'h3' : 'h2'
  const subtitle = args.subtitle

  return (
    <div className="my-8 not-prose">
      <PostsRow posts={preloadedPosts} title={title} subtitle={subtitle} titleTag={titleTag} />
    </div>
  )
}
