'use server'

import { getTopics, getPostsByTags, ShortcodeArgs } from '@/services/shortcode'
import { Post } from '@/payload-types'
import { TopicWithImage } from '@/components/frontend/node-topics'

/**
 * Fetch topics based on shortcode arguments.
 * Currently supports fetching by tags (finding related topics) or search.
 */
export async function fetchTopicsByShortcode(args: ShortcodeArgs): Promise<TopicWithImage[]> {
  try {
    return await getTopics(args)
  } catch (error) {
    console.error('Error in fetchTopicsByShortcode:', error)
    return []
  }
}

/**
 * Fetch posts based on shortcode arguments.
 * Supports fetching related posts by tags.
 */
export async function fetchPostsByShortcode(args: ShortcodeArgs): Promise<Post[]> {
  try {
    if (args.tags && args.tags.length > 0) {
      const posts = await getPostsByTags(args.tags, args.limit, args.excludeSlug)
      return posts as Post[]
    }

    return []
  } catch (error) {
    console.error('Error in fetchPostsByShortcode:', error)
    return []
  }
}
