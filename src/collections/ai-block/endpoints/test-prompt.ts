import { PayloadHandler } from 'payload'
import { getPayloadClient } from '@/lib/payload'
import { getTopicProductsData } from '@/services/topics/get-topic-products-data'
import { getTopicProductsSimpleData } from '@/services/topics/get-topic-products-simple-data'
import { AnthropicClient } from '@/services/anthropic-client'
import { renderPromptTemplate } from '@/services/llm/render-prompt-template'
import { PromptMetadata } from '@/services/llm/validate-prompt-metadata'

export const testPromptHandler: PayloadHandler = async (req) => {
  if (!req.json) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Parse body ONCE
  const { prompt, type, metadata: metadataFromRequest } = await req.json()

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
    depth: 1, // Populate relationships like tags
  })

  if (!topicDetails.docs.length) {
    return Response.json({ error: 'No active topic found' }, { status: 404 })
  }

  const topic = topicDetails.docs[0]
  const anthropic = new AnthropicClient()

  try {
    let response: string = ''
    let messages: any[] = []

    if (type === 'metadata') {
      const simpleData = await getTopicProductsSimpleData(topic.id)
      if (!simpleData) {
        return Response.json({ error: 'Failed to fetch simple topic data' }, { status: 500 })
      }

      // Render prompt with simple data context
      const renderedPrompt = renderPromptTemplate(prompt, simpleData)

      messages = [
        {
          role: 'user',
          content: `<products>${JSON.stringify(simpleData)}</products>`,
        },
      ]

      response = await anthropic.generate(messages, renderedPrompt)

      // Validation for Metadata
      try {
        // Attempt to extract JSON from response (handling markdown code blocks if present)
        const jsonMatch =
          response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/)
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response

        const parsed = JSON.parse(jsonString)
        const { validatePromptMetadata } = await import('@/services/llm/validate-prompt-metadata')
        validatePromptMetadata(parsed)

        return Response.json({
          result: response,
          validation: { valid: true },
        })
      } catch (err: any) {
        let errors: string[] = [err.message]
        if (err.name === 'ZodError') {
          errors = err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`)
        }
        return Response.json({
          result: response,
          validation: { valid: false, errors },
        })
      }
    } else {
      // CONTENT generation (default or explicit)
      const topicData = await getTopicProductsData(topic.id)
      if (!topicData) {
        return Response.json({ error: 'Failed to fetch topic data' }, { status: 500 })
      }

      let metadata: PromptMetadata

      // If metadata string is provided in request (from step 1), use it
      if (metadataFromRequest) {
        try {
          const metadataStr = metadataFromRequest
          // Extract JSON if it's wrapped in markdown
          const jsonMatch =
            metadataStr.match(/```json\n([\s\S]*?)\n```/) || metadataStr.match(/\{[\s\S]*\}/)
          const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : metadataStr

          metadata = JSON.parse(jsonString)
        } catch (e) {
          console.warn('Failed to parse provided metadata, falling back to topic data', e)
          // Fallback to topic data below
          metadata = {
            title: topic.meta_title || topic.name,
            description: topic.meta_description || 'Description placeholder',
            keywords: topic.meta_keywords
              ? topic.meta_keywords.split(',').map((k: string) => k.trim())
              : [],
            tags: Array.isArray(topic.tags)
              ? topic.tags.map((t: any) => (typeof t === 'object' && t.name ? t.name : String(t)))
              : [],
            introductory:
              typeof topic.introductory === 'string'
                ? topic.introductory
                : JSON.stringify(topic.introductory || ''),
            excerpt: topic.excerpt || 'Excerpt placeholder',
          }
        }
      } else {
        // Construct Mock Metadata from Topic for context
        metadata = {
          title: topic.meta_title || topic.name,
          description: topic.meta_description || 'Description placeholder',
          keywords: topic.meta_keywords
            ? topic.meta_keywords.split(',').map((k: string) => k.trim())
            : [],
          tags: Array.isArray(topic.tags)
            ? topic.tags.map((t: any) => (typeof t === 'object' && t.name ? t.name : String(t)))
            : [],
          introductory:
            typeof topic.introductory === 'string'
              ? topic.introductory
              : JSON.stringify(topic.introductory || ''),
          excerpt: topic.excerpt || 'Excerpt placeholder',
        }
      }

      const context = {
        ...topicData,
        metadata,
      }

      const renderedPrompt = renderPromptTemplate(prompt, context)

      messages = [
        {
          role: 'user',
          content: `<products>${JSON.stringify(topicData)}</products>`,
        },
        {
          role: 'user',
          content: `<metadata>${JSON.stringify(metadata)}</metadata>`,
        },
      ]

      response = await anthropic.generate(messages, renderedPrompt)
    }

    return Response.json({ result: response })
  } catch (error: any) {
    console.error('Error generating content:', error)
    return Response.json({ error: error.message || 'Error generating content' }, { status: 500 })
  }
}
