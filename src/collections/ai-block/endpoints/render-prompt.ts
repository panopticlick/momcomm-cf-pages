import { PayloadHandler } from 'payload'
import { getPayloadClient } from '@/lib/payload'
import { getTopicProductsData } from '@/services/topics/get-topic-products-data'
import { renderPromptTemplate } from '@/services/llm/render-prompt-template'

export const renderPromptHandler: PayloadHandler = async (req) => {
  if (!req.json) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { prompt } = await req.json()

  if (!prompt) {
    return Response.json({ error: 'Prompt is required' }, { status: 400 })
  }

  const payload = await getPayloadClient()

  // Find one active topic
  const topicDetails = await payload.find({
    collection: 'topics',
    limit: 1,
    where: {
      active: {
        equals: true,
      },
    },
  })

  if (!topicDetails.docs.length) {
    return Response.json({ error: 'No active topic found' }, { status: 404 })
  }

  const topic = topicDetails.docs[0]
  const topicData = await getTopicProductsData(topic.id)

  if (!topicData) {
    return Response.json({ error: 'Failed to fetch topic data' }, { status: 500 })
  }

  try {
    const renderedPrompt = renderPromptTemplate(prompt, topicData)
    return Response.json({ result: renderedPrompt })
  } catch (error: any) {
    console.error('Error rendering prompt:', error)
    return Response.json({ error: error.message || 'Error rendering prompt' }, { status: 500 })
  }
}
