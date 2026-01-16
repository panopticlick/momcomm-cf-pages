import { Payload } from 'payload'
import { getTopicProductsSimpleData } from '@/services/topics/get-topic-products-simple-data'
import { getTopicProductsData } from '@/services/topics/get-topic-products-data'
import { AnthropicClient } from '@/services/anthropic-client'
import { renderPromptTemplate } from '@/services/llm/render-prompt-template'
import { validatePromptMetadata } from '@/services/llm/validate-prompt-metadata'
import { extractJsonFromText } from '@/services/llm/extract-json'
import { convertMarkdownToRichText } from '@/services/llm/convert-markdown-to-richtext'
import { convertToSlug } from '@/utilities/convert-to-slug'

export interface ProcessAiBlockJobsResult {
  processed: number
  errors: number
  results?: any[]
}

export async function processAiBlockJobs(
  payload: Payload,
  limit: number = 5,
): Promise<ProcessAiBlockJobsResult> {
  const anthropic = new AnthropicClient()

  let processedCount = 0
  let errorsCount = 0

  // 1. Find Topics that are ready for processing
  // Priority: QUEUED (Metadata) -> METADATA_COMPLETED (Content)
  const topics = await payload.find({
    collection: 'topics',
    where: {
      or: [{ ai_status: { equals: 'QUEUED' } }, { ai_status: { equals: 'METADATA_COMPLETED' } }],
    },
    limit: limit,
    sort: 'createdAt', // Process oldest updated first (FIFOish for status changes)
  })

  if (topics.totalDocs === 0) {
    return { processed: 0, errors: 0 }
  }

  for (const topic of topics.docs) {
    let currentJobId: string | number | null = null
    let currentJobType: 'metadata' | 'content' | null = null

    try {
      // QUEUED -> Metadata Generation
      if (topic.ai_status === 'QUEUED') {
        const jobs = await payload.find({
          collection: 'ai-block-jobs',
          where: {
            and: [
              { topic: { equals: topic.id } },
              { type: { equals: 'metadata' } },
              { status: { equals: 'PENDING' } },
            ],
          },
          limit: 1,
        })

        if (jobs.totalDocs === 0) {
          console.warn(`Topic ${topic.id} is QUEUED but no pending metadata job found. Skipping.`)
          continue
        }

        const job = jobs.docs[0]
        currentJobId = job.id
        currentJobType = 'metadata'
        const aiBlock = typeof job.ai_block === 'object' ? job.ai_block : null

        if (!aiBlock) {
          throw new Error('AiBlock not populated in job')
        }

        // 1. Update status to PROCESSING
        await payload.update({
          collection: 'topics',
          id: topic.id,
          data: { ai_status: 'METADATA_PROCESSING' },
        })
        await payload.update({
          collection: 'ai-block-jobs',
          id: job.id,
          data: { status: 'PROCESSING' },
        })

        // 2. Prepare Data & Prompt
        let authorId: string | number | null = null
        if (aiBlock.authors && Array.isArray(aiBlock.authors) && aiBlock.authors.length > 0) {
          const randomIndex = Math.floor(Math.random() * aiBlock.authors.length)
          const validAuthor = aiBlock.authors[randomIndex]
          if (validAuthor && validAuthor.value) {
            authorId =
              typeof validAuthor.value === 'object' ? validAuthor.value.id : validAuthor.value
          }
        }

        const simpleData = await getTopicProductsSimpleData(topic.id)
        if (!simpleData) throw new Error('Failed to fetch topic products simple data')

        const promptTemplate = aiBlock.prompt_metadata
        const renderedPrompt = renderPromptTemplate(promptTemplate, simpleData)

        // 3. Generate
        const responseText = await anthropic.generate(
          [
            {
              role: 'user',
              content: `<products>${JSON.stringify(simpleData.products)}</products>`,
            },
          ],
          renderedPrompt, // System prompt
        )

        // 4. Validate & Extract
        const json = extractJsonFromText(responseText)
        if (!json) throw new Error('Failed to extract JSON from response')

        const metadata = validatePromptMetadata(json)

        // 4.1 Process Tags
        const tagIds: any[] = []
        if (metadata.tags && Array.isArray(metadata.tags)) {
          for (const tagName of metadata.tags) {
            const slug = convertToSlug(tagName)

            if (!slug) continue

            try {
              const existingTags = await payload.find({
                collection: 'tags',
                where: {
                  slug: { equals: slug },
                },
                limit: 1,
              })

              if (existingTags.totalDocs > 0) {
                tagIds.push(existingTags.docs[0].id)
              } else {
                const newTag = await payload.create({
                  collection: 'tags',
                  data: {
                    name: tagName,
                    slug: slug,
                  },
                })
                tagIds.push(newTag.id)
              }
            } catch (error) {
              console.warn(`Failed to process tag "${tagName}" for topic ${topic.id}`, error)
            }
          }
        }

        // 5. Success - Update Topic & Job
        await payload.update({
          collection: 'topics',
          id: topic.id,
          data: {
            ai_status: 'METADATA_COMPLETED',
            meta_title: metadata.title,
            meta_description: metadata.description,
            meta_keywords: metadata.keywords.join(', '),
            introductory: await convertMarkdownToRichText(
              metadata.introductory
                .trim()
                .replace(/^#\s+[^\n]*\n?/, '')
                .trim(),
              payload.config,
            ),
            excerpt: metadata.excerpt,
            tags: tagIds,
            authors: authorId ? [authorId] : [],
          },
        })

        await payload.update({
          collection: 'ai-block-jobs',
          id: job.id,
          data: {
            status: 'COMPLETED',
            data: metadata,
          },
        })
      } else if (topic.ai_status === 'METADATA_COMPLETED') {
        // CONTENT Generation
        const jobs = await payload.find({
          collection: 'ai-block-jobs',
          where: {
            and: [
              { topic: { equals: topic.id } },
              { type: { equals: 'content' } },
              { status: { equals: 'PENDING' } },
            ],
          },
          limit: 1,
        })

        if (jobs.totalDocs === 0) {
          console.warn(`Topic ${topic.id} is METADATA_COMPLETED but no pending content job found.`)
          continue
        }

        const job = jobs.docs[0]
        currentJobId = job.id
        currentJobType = 'content'
        const aiBlock = typeof job.ai_block === 'object' ? job.ai_block : null
        if (!aiBlock) {
          throw new Error('AiBlock not populated in job')
        }

        // 1. Update status
        await payload.update({
          collection: 'topics',
          id: topic.id,
          data: { ai_status: 'CONTENT_PROCESSING' },
        })
        await payload.update({
          collection: 'ai-block-jobs',
          id: job.id,
          data: { status: 'PROCESSING' },
        })

        // 2. Prepare Data
        const topicData = await getTopicProductsData(topic.id)
        if (!topicData) throw new Error('Failed to fetch topic products data')

        // Construct metadata context from topic
        const metadata = {
          title: topic.meta_title || topic.name,
          description: topic.meta_description || '',
          keywords: topic.meta_keywords ? topic.meta_keywords.split(',').map((k) => k.trim()) : [],
          tags: [],
          introductory: '',
          excerpt: topic.excerpt || '',
        }

        const context = {
          ...topicData,
          metadata,
        }

        const promptTemplate = aiBlock.prompt_content
        const renderedPrompt = renderPromptTemplate(promptTemplate, context)

        // 3. Generate
        const responseText = await anthropic.generate(
          [
            {
              role: 'user',
              content: `<products>${JSON.stringify(topicData.products)}</products>`,
            },
            {
              role: 'user',
              content: `<metadata>${JSON.stringify(metadata)}</metadata>`,
            },
          ],
          renderedPrompt,
        )

        // 4. Update - 移除 H1 并使用 Markdown 转换保留完整格式
        const cleanedContent = responseText
          .trim()
          .replace(/^#\s+[^\n]*\n?/, '')
          .trim()

        // 检测单词数，不低于300个单词
        const wordCount = cleanedContent.split(/\s+/).filter((word) => word.length > 0).length
        if (wordCount < 300) {
          throw new Error(
            `Content word count (${wordCount}) is below minimum requirement of 300 words`,
          )
        }

        const contentRichText = await convertMarkdownToRichText(cleanedContent, payload.config)

        await payload.update({
          collection: 'topics',
          id: topic.id,
          data: {
            ai_status: 'CONTENT_COMPLETED',
            content: contentRichText,
          },
        })

        await payload.update({
          collection: 'ai-block-jobs',
          id: job.id,
          data: {
            status: 'COMPLETED',
          },
        })
      }

      processedCount++
    } catch (err: any) {
      console.error(`Error processing topic ${topic.id}:`, err)
      errorsCount++

      // Handle Error State
      const errorStatus =
        currentJobType === 'metadata' || topic.ai_status === 'QUEUED'
          ? 'METADATA_ERROR'
          : 'CONTENT_ERROR'

      await payload.update({
        collection: 'topics',
        id: topic.id,
        data: { ai_status: errorStatus },
      })

      // Update job status and message
      if (currentJobId) {
        await payload.update({
          collection: 'ai-block-jobs',
          id: currentJobId,
          data: {
            status: 'ERROR',
            message: err.message || String(err),
          },
        })
      }
    }
  }

  return {
    processed: processedCount,
    errors: errorsCount,
  }
}
