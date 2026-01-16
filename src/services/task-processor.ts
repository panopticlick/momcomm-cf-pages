import { getPayloadClient } from '@/lib/payload'
import { AmzApiClient } from '@/services/amz-api-client'
import { config } from '@/lib/config'

export const processPendingTask = async () => {
  const payload = await getPayloadClient()

  // 0. Check for global concurrency limit
  const runningTasks = await payload.count({
    collection: 'tasks',
    where: {
      status: {
        equals: 'PROCESSING',
      },
    },
  })

  if (runningTasks.totalDocs > 0) {
    console.log('Skipping execution: Another task is currently processing.')
    return
  }

  // 1. Fetch potential candidates without locking first
  const candidates = await payload.find({
    collection: 'tasks',
    where: {
      status: {
        in: ['PENDING'],
      },
    },
    limit: 1,
    sort: 'createdAt',
  })

  if (candidates.totalDocs === 0) {
    console.log('No pending tasks found.')
    return
  }

  // Try to claim and process ONE task
  for (const candidate of candidates.docs) {
    let claimedTask = null

    // TRANSACTION: Process Claiming
    const t = await payload.db.beginTransaction()

    if (!t) {
      console.warn('Transactions not supported by database adapter')
    }

    try {
      // Atomic Update: Only update if status is still PENDING
      const claimResult = await payload.update({
        collection: 'tasks',
        where: {
          and: [{ id: { equals: candidate.id } }, { status: { in: ['PENDING'] } }],
        },
        data: {
          status: 'PROCESSING',
          message: 'Task is initializing...',
        },
        req: t ? { transactionID: t } : undefined,
      })

      if (claimResult.docs.length > 0) {
        claimedTask = claimResult.docs[0]
        if (t) await payload.db.commitTransaction(t)
      } else {
        if (t) await payload.db.rollbackTransaction(t)
        continue
      }
    } catch (e) {
      payload.logger.error(`Error claiming task ${candidate.id}: ${e}`)
      if (t) await payload.db.rollbackTransaction(t)
      continue
    }

    const task = claimedTask

    try {
      // Fetch all nodes
      // Fetch all nodes
      const allNodes = await payload.find({
        collection: 'nodes',
        limit: 0,
        pagination: false,
      })

      const nodeIds: string[] = []
      const taskNodeIds = (task as any).node_ids as string[] | undefined

      if (taskNodeIds && Array.isArray(taskNodeIds) && taskNodeIds.length > 0) {
        // Build adjacency list (parent -> children)
        const childrenMap = new Map<string, string[]>()

        allNodes.docs.forEach((n: any) => {
          if (!n.node_id) return
          if (n.parent) {
            const children = childrenMap.get(n.parent) || []
            children.push(n.node_id)
            childrenMap.set(n.parent, children)
          }
        })

        const selectedRoots = new Set(taskNodeIds)
        // Set to store all found node IDs (roots + descendants)
        const foundNodes = new Set<string>()

        // Queue for BFS traversal
        const queue: string[] = [...selectedRoots]

        // Safety: Prevent infinite loops with a hard limit
        let loopCount = 0
        const MAX_LOOPS = config.database.maxNodeTraversalLoops

        while (queue.length > 0) {
          loopCount++
          if (loopCount > MAX_LOOPS) {
            console.warn(
              `[Task ${task.id}] Node traversal hit max loop limit of ${MAX_LOOPS}. Stopping traversal.`,
            )
            break
          }

          const currentId = queue.shift()!

          if (!foundNodes.has(currentId)) {
            foundNodes.add(currentId)

            // Add children to queue
            const children = childrenMap.get(currentId)
            if (children) {
              children.forEach((childId) => {
                if (!foundNodes.has(childId)) {
                  queue.push(childId)
                }
              })
            }
          }
        }

        // Only include nodes that exist in our allNodes list (validation)
        const validNodeById = new Map<string, boolean>()
        allNodes.docs.forEach((n: any) => {
          if (n.node_id) validNodeById.set(n.node_id, true)
        })

        foundNodes.forEach((id) => {
          if (validNodeById.has(id)) {
            nodeIds.push(id)
          }
        })
      } else {
        allNodes.docs.forEach((n) => {
          if (n.node_id) {
            nodeIds.push(n.node_id as string)
          }
        })
      }

      if (nodeIds.length === 0) {
        await payload.update({
          collection: 'tasks',
          id: task.id,
          data: {
            status: 'COMPLETED',
            message: 'No nodes found to process.',
          },
        })
        break
      }

      // Get total count from API
      const amzApi = new AmzApiClient()
      const numericNodeIds = nodeIds
        .map((id: string) => parseInt(id, 10))
        .filter((id: number) => !isNaN(id))

      console.log(`[Task ${task.id}] Fetching total count for keyword "${task.keywords}"`)

      const countResponse = await amzApi.getKeywordsAsinsWithNodesLastYear({
        node_ids: numericNodeIds.length > 0 ? numericNodeIds : undefined,
        keywords: task.keywords,
        period_type: 'weekly',
        limit: 1,
        offset: 0,
      })

      const total = countResponse.total

      if (total === 0) {
        await payload.update({
          collection: 'tasks',
          id: task.id,
          data: {
            status: 'COMPLETED',
            message: 'No records found in API.',
          },
        })
        break
      }

      // Calculate number of jobs needed
      const BATCH_SIZE = config.database.batchSize
      const jobCount = Math.ceil(total / BATCH_SIZE)
      console.log(`[Task ${task.id}] Total: ${total}, creating ${jobCount} jobs`)

      // Create SearchTermAsinJob records for each batch
      const jobPromises = []
      for (let i = 0; i < jobCount; i++) {
        const offset = i * BATCH_SIZE
        jobPromises.push(
          payload.create({
            collection: 'search-term-asin-jobs',
            data: {
              task: task.id,
              keywords: task.keywords,
              node_ids: nodeIds,
              offset: offset,
              limit: BATCH_SIZE,
              total: total,
              status: 'PENDING',
            },
          }),
        )
      }

      await Promise.all(jobPromises)

      // Update task message
      await payload.update({
        collection: 'tasks',
        id: task.id,
        data: {
          message: `Created ${jobCount} jobs for processing (total: ${total} records)`,
        },
      })

      console.log(`[Task ${task.id}] Created ${jobCount} SearchTermAsinJob records`)
      break // Process only 1 task per execution
    } catch (error) {
      console.error(`Error processing task ${task.id}:`, error)
      await payload.update({
        collection: 'tasks',
        id: task.id,
        data: {
          status: 'ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      })
    }
  }
}
