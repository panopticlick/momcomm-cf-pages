import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { processAiBlockJobs } from '../../../../src/services/cron/process-ai-block-jobs'

// Mocks
const mockGenerate = vi.fn()

vi.mock('@/services/anthropic-client', () => ({
  AnthropicClient: vi.fn().mockImplementation(() => ({
    generate: mockGenerate,
  })),
}))

vi.mock('@/services/topics/get-topic-products-simple-data', () => ({
  getTopicProductsSimpleData: vi.fn().mockResolvedValue({ products: [] }),
}))

vi.mock('@/services/topics/get-topic-products-data', () => ({
  getTopicProductsData: vi.fn().mockResolvedValue({ products: [] }),
}))

vi.mock('@/services/llm/extract-json', () => ({
  extractJsonFromText: vi.fn().mockReturnValue({ title: 'Mock' }),
}))

vi.mock('@/services/llm/validate-prompt-metadata', () => ({
  validatePromptMetadata: vi.fn().mockReturnValue({
    title: 'Mock Title',
    description: 'Mock Description',
    keywords: ['k1'],
    introductory: 'Intro',
    excerpt: 'Excerpt',
  }),
}))

vi.mock('@/services/llm/convert-markdown-to-richtext', () => ({
  convertMarkdownToRichText: vi.fn().mockResolvedValue({}),
}))

describe('processAiBlockJobs', () => {
  let mockPayload: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockPayload = {
      find: vi.fn(),
      update: vi.fn(),
    }
  })

  it('should return 0 processed if no topics found', async () => {
    mockPayload.find.mockResolvedValueOnce({ totalDocs: 0, docs: [] })

    const result = await processAiBlockJobs(mockPayload)

    expect(result.processed).toBe(0)
    expect(result.errors).toBe(0)
    expect(mockPayload.find).toHaveBeenCalledTimes(1)
  })

  it('should process a QUEUED topic (Metadata)', async () => {
    // 1. Mock Topics Response
    mockPayload.find.mockResolvedValueOnce({
      totalDocs: 1,
      docs: [{ id: 1, ai_status: 'QUEUED' }],
    })

    // 2. Mock Jobs Response
    mockPayload.find.mockResolvedValueOnce({
      totalDocs: 1,
      docs: [
        {
          id: 101,
          type: 'metadata',
          status: 'PENDING',
          ai_block: { id: 999, prompt_metadata: 'Prompt' },
        },
      ],
    })

    // Set generate mock return
    mockGenerate.mockResolvedValue('JSON Output')

    const result = await processAiBlockJobs(mockPayload)

    expect(result.processed).toBe(1)
    expect(result.errors).toBe(0)

    // Verify updates
    // Topic status update to PROCESSING
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'topics',
        id: 1,
        data: { ai_status: 'METADATA_PROCESSING' },
      }),
    )
    // Job status update to PROCESSING
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'ai-block-jobs',
        id: 101,
        data: { status: 'PROCESSING' },
      }),
    )

    // Topic status update to COMPLETED
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'topics',
        id: 1,
        data: expect.objectContaining({ ai_status: 'METADATA_COMPLETED' }),
      }),
    )
  })

  it('should process a METADATA_COMPLETED topic (Content)', async () => {
    // 1. Mock Topics Response
    mockPayload.find.mockResolvedValueOnce({
      totalDocs: 1,
      docs: [{ id: 2, ai_status: 'METADATA_COMPLETED', meta_title: 'T' }],
    })

    // 2. Mock Jobs Response
    mockPayload.find.mockResolvedValueOnce({
      totalDocs: 1,
      docs: [
        {
          id: 102,
          type: 'content',
          status: 'PENDING',
          ai_block: { id: 999, prompt_content: 'Content Prompt' },
        },
      ],
    })

    const longContent = Array.from({ length: 320 }, (_, i) => `word${i}`).join(' ')
    mockGenerate.mockResolvedValue(longContent)

    const result = await processAiBlockJobs(mockPayload)

    expect(result.processed).toBe(1)
    expect(result.errors).toBe(0)

    // Verify updates
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'topics',
        id: 2,
        data: { ai_status: 'CONTENT_PROCESSING' },
      }),
    )

    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'topics',
        id: 2,
        data: expect.objectContaining({ ai_status: 'CONTENT_COMPLETED' }),
      }),
    )
  })

  it('should handle errors and update status', async () => {
    // 1. Mock Topics Response
    mockPayload.find.mockResolvedValueOnce({
      totalDocs: 1,
      docs: [{ id: 3, ai_status: 'QUEUED' }],
    })

    // 2. Mock Jobs Response (Empty to trigger simple warn loop skip)
    // Wait, if no jobs found it just continues. Let's make it fail inside block.
    // Return a job, but fail generate.

    mockPayload.find.mockResolvedValueOnce({
      totalDocs: 1,
      docs: [
        {
          id: 103,
          type: 'metadata',
          status: 'PENDING',
          ai_block: { id: 999, prompt_metadata: 'Prompt' },
        },
      ],
    })

    mockGenerate.mockRejectedValue(new Error('API Fail'))

    const result = await processAiBlockJobs(mockPayload)

    expect(result.processed).toBe(0) // Logic inc processed ONLY at end of loop success
    expect(result.errors).toBe(1)

    // Verify Error Update
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'topics',
        id: 3,
        data: { ai_status: 'METADATA_ERROR' },
      }),
    )
  })
})
