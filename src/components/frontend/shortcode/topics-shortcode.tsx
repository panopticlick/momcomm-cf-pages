'use client'

import React from 'react'
import { ShortcodeArgs } from '@/services/shortcode'
import { TopicsRow } from '@/components/frontend/topic/topics-row'
import type { TopicWithImage } from '@/components/frontend/node-topics'

interface TopicsShortcodeProps {
  args: ShortcodeArgs
  preloadedTopics?: TopicWithImage[]
}

export function TopicsShortcode({ args, preloadedTopics }: TopicsShortcodeProps) {
  // If no preloaded data, render nothing (server-side rendering expected)
  if (!preloadedTopics || preloadedTopics.length === 0) {
    return null
  }

  const title =
    args.h2 || args.h3 || (args.search ? `Results for "${args.search}"` : 'Related Topics')
  const titleTag = args.h2 ? 'h2' : 'h3'
  const subtitle = args.subtitle

  return (
    <div className="my-8 not-prose">
      <TopicsRow topics={preloadedTopics} title={title} subtitle={subtitle} titleTag={titleTag} />
    </div>
  )
}
