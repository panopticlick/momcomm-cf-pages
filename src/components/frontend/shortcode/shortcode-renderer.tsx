'use client'

import React from 'react'
import { splitByShortcode, ShortcodeMatch } from '@/components/lib/shortcode-parser'
import { TopicsShortcode } from './topics-shortcode'
import { PostsShortcode } from './posts-shortcode'
import type { TopicWithImage } from '@/components/frontend/node-topics'
import type { Post } from '@/payload-types'

import { useShortcodeData } from '@/components/frontend/shortcode/shortcode-context'

interface ShortcodeRendererProps {
  content: string
}

export function ShortcodeRenderer({ content }: ShortcodeRendererProps) {
  const parts = splitByShortcode(content)
  const context = useShortcodeData()

  if (parts.length === 1 && typeof parts[0] === 'string') {
    return <>{content}</>
  }

  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <React.Fragment key={index}>{part}</React.Fragment>
        }

        const match = part as ShortcodeMatch
        const id = match.args._id
        const preloadedItem = id && context ? context.getData(id) : undefined

        switch (match.type) {
          case 'topics': {
            const topics =
              preloadedItem?.type === 'topics'
                ? (preloadedItem.data as TopicWithImage[])
                : undefined
            return <TopicsShortcode key={index} args={match.args} preloadedTopics={topics} />
          }
          case 'posts': {
            const posts =
              preloadedItem?.type === 'posts' ? (preloadedItem.data as Post[]) : undefined
            return <PostsShortcode key={index} args={match.args} preloadedPosts={posts} />
          }
          default:
            return null
        }
      })}
    </>
  )
}
