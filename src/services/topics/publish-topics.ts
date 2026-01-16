import { getPayloadClient } from '@/lib/payload'

export async function publishTopics({ limit = 10 }: { limit?: number }) {
  const payload = await getPayloadClient()

  // 1. Find pending topics that do NOT require review
  const { docs: pendingTopics } = await payload.find({
    collection: 'topics',
    where: {
      and: [
        {
          active: {
            equals: false,
          },
        },
        {
          redirect: {
            equals: false,
          },
        },
        {
          ai_status: {
            equals: 'CONTENT_COMPLETED',
          },
        },
        {
          requires_review: {
            equals: false,
          },
        },
      ],
    },
    sort: '-weighted_score_sum',
    limit,
    overrideAccess: true,
  })

  if (pendingTopics.length === 0) {
    return {
      publishedCount: 0,
      publishedTopics: [],
      message: 'No pending topics found',
    }
  }

  // 2. Update them to active: true
  const publishedTopics = []

  for (const topic of pendingTopics) {
    try {
      const updatedTopic = await payload.update({
        collection: 'topics',
        id: topic.id,
        data: {
          active: true,
          ai_status: 'COMPLETED',
        },
        overrideAccess: true,
      })
      publishedTopics.push(updatedTopic.name)
    } catch (error) {
      console.error(`Failed to publish topic ${topic.id} (${topic.name}):`, error)
    }
  }

  return {
    publishedCount: publishedTopics.length,
    publishedTopics,
  }
}
