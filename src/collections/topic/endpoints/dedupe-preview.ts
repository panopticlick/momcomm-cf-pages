import { PayloadHandler } from 'payload'
import { getPayloadClient } from '@/lib/payload'
import { findDuplicateTopicsWithAI } from '@/services/topics/ai-dedupe-topics'
import {
  getTopicsForDeduplication,
  mapDuplicateGroupsToTopics,
  findDuplicatesByWordSet,
} from '@/services/topics/dedupe-topics'
import { AnthropicClient } from '@/services/anthropic-client'

export const dedupePreviewHandler: PayloadHandler = async (req) => {
  const url = new URL(req.url || '', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost')
  const searchParams = url.searchParams
  const mode = searchParams.get('mode') || 'code'

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'))
      }

      // Heartbeat to prevent Cloudflare timeout (100s limit)
      const heartbeatInterval = setInterval(() => {
        try {
          send({ type: 'heartbeat', timestamp: Date.now() })
        } catch {
          // Stream might be closed, ignore
        }
      }, 20000) // Every 20 seconds

      try {
        const payload = await getPayloadClient()

        // 1. Get topics data
        send({ type: 'status', message: 'Fetching topics...' })
        const topics = await getTopicsForDeduplication(payload)

        if (topics.length === 0) {
          send({
            type: 'result',
            success: true,
            message: 'No topics found for deduplication',
            totalTopics: 0,
            duplicateGroups: [],
            totalDuplicates: 0,
            mode,
          })
          clearInterval(heartbeatInterval)
          controller.close()
          return
        }

        // 2. Extract names for analysis
        const names = topics.map((t) => t.name)

        // 3. Find duplicates based on mode
        let duplicateNameGroups: string[][]

        if (mode === 'ai') {
          const anthropicClient = new AnthropicClient()
          duplicateNameGroups = await findDuplicateTopicsWithAI(anthropicClient, names, (msg) => {
            send({ type: 'status', message: msg })
          })
        } else {
          // Default: code-based deduplication
          send({ type: 'status', message: 'Running code-based deduplication...' })
          duplicateNameGroups = findDuplicatesByWordSet(names)
        }

        // 4. Map name groups back to full topic objects with isMain logic
        send({ type: 'status', message: 'Mapping results...' })
        const duplicateGroups = mapDuplicateGroupsToTopics(topics, duplicateNameGroups)

        send({
          type: 'result',
          success: true,
          message: `Preview completed using ${mode} mode`,
          mode,
          totalTopics: topics.length,
          totalDuplicates: duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0),
          duplicateGroups,
        })
        clearInterval(heartbeatInterval)
        controller.close()
      } catch (error) {
        console.error('Dedupe preview error:', error)
        send({
          type: 'error',
          success: false,
          message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        })
        clearInterval(heartbeatInterval)
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      'X-Content-Type-Options': 'nosniff',
      // Disable buffering for Nginx and Cloudflare
      'X-Accel-Buffering': 'no',
    },
  })
}
