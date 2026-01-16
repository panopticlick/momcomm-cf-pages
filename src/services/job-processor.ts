import { getPayloadClient } from '@/lib/payload'
import { AmzApiClient } from '@/services/amz-api-client'

export const processPendingJobs = async () => {
  const payload = await getPayloadClient()

  // 1. Check for currently processing jobs (limit concurrency)
  const processingJobs = await payload.count({
    collection: 'search-term-asin-jobs',
    where: {
      status: {
        equals: 'PROCESSING',
      },
    },
  })

  if (processingJobs.totalDocs > 0) {
    console.log('Skipping: Another job is currently processing.')
    return { processed: false, message: 'Another job is processing' }
  }

  // 2. Find pending jobs
  const pendingJobs = await payload.find({
    collection: 'search-term-asin-jobs',
    where: {
      status: {
        equals: 'PENDING',
      },
    },
    limit: 1,
    sort: 'createdAt',
  })

  if (pendingJobs.totalDocs === 0) {
    console.log('No pending jobs found.')
    return { processed: false, message: 'No pending jobs' }
  }

  const job = pendingJobs.docs[0]

  // 3. Claim the job with transaction
  const t = await payload.db.beginTransaction()

  try {
    const claimResult = await payload.update({
      collection: 'search-term-asin-jobs',
      where: {
        and: [{ id: { equals: job.id } }, { status: { equals: 'PENDING' } }],
      },
      data: {
        status: 'PROCESSING',
        message: 'Job started...',
      },
      req: t ? { transactionID: t } : undefined,
    })

    if (claimResult.docs.length === 0) {
      // Job was already claimed by another process
      if (t) await payload.db.rollbackTransaction(t)
      return { processed: false, message: 'Job was already claimed' }
    }

    // Commit the transaction to ensure job is claimed
    if (t) await payload.db.commitTransaction(t)

    // 4. Process the job
    try {
      const amzApi = new AmzApiClient()

      const nodeIds = (job.node_ids as string[]) || []
      const numericNodeIds = nodeIds
        .map((id: string) => parseInt(id, 10))
        .filter((id: number) => !isNaN(id))

      console.log(
        `[Job ${job.id}] Processing keyword "${job.keywords}" offset ${job.offset}, limit ${job.limit}`,
      )

      const response = await amzApi.getKeywordsAsinsWithNodesLastYear({
        node_ids: numericNodeIds.length > 0 ? numericNodeIds : undefined,
        keywords: job.keywords,
        period_type: 'weekly',
        limit: job.limit,
        offset: job.offset,
      })

      let savedCount = 0

      if (response.items && response.items.length > 0) {
        // Start a new transaction for the data updates
        const dataTransaction = await payload.db.beginTransaction()

        try {
          for (const item of response.items) {
            // Filter out keywords starting with 'best' (case-insensitive)
            if (item.keywords.toLowerCase().startsWith('best ')) {
              continue
            }

            const keywords = item.keywords.replace(/&#39;/g, "'")

            // Upsert logic
            const existingDocs = await payload.find({
              collection: 'aba-search-terms',
              where: {
                and: [{ keywords: { equals: keywords } }, { asin: { equals: item.asin } }],
              },
              limit: 1,
              req: dataTransaction ? { transactionID: dataTransaction } : undefined,
            })

            if (existingDocs.totalDocs > 0) {
              const existingDoc = existingDocs.docs[0]
              // Skip if end_date is the same
              if (existingDoc.end_date === item.end_date) {
                continue
              }
              await payload.update({
                collection: 'aba-search-terms',
                id: existingDoc.id,
                data: {
                  occurrences: item.rank_count,
                  search_rank: item.rank_avg,
                  conversion_share: item.conversion_share_sum,
                  click_share: item.click_share_sum,
                  weighted_score: item.weighted_score_sum,
                  start_date: item.start_date,
                  end_date: item.end_date,
                  node_ids: item.node_ids,
                },
                req: dataTransaction ? { transactionID: dataTransaction } : undefined,
              })
            } else {
              await payload.create({
                collection: 'aba-search-terms',
                data: {
                  keywords: keywords,
                  asin: item.asin,
                  occurrences: item.rank_count,
                  search_rank: item.rank_avg,
                  conversion_share: item.conversion_share_sum,
                  click_share: item.click_share_sum,
                  weighted_score: item.weighted_score_sum,
                  start_date: item.start_date,
                  end_date: item.end_date,
                  node_ids: item.node_ids,
                },
                req: dataTransaction ? { transactionID: dataTransaction } : undefined,
              })
            }
            savedCount++
          }

          // Commit data transaction
          if (dataTransaction) await payload.db.commitTransaction(dataTransaction)
        } catch (dataError) {
          // Rollback data transaction on error
          if (dataTransaction) await payload.db.rollbackTransaction(dataTransaction)
          throw dataError
        }
      }

      // 5. Mark job as completed (separate transaction)
      const completionTransaction = await payload.db.beginTransaction()
      try {
        await payload.update({
          collection: 'search-term-asin-jobs',
          id: job.id,
          data: {
            status: 'COMPLETED',
            message: `Saved ${savedCount} records (fetched ${response.items?.length || 0})`,
            completed_at: new Date().toISOString(),
            body: {
              fetchedItems: response.items?.length || 0,
              savedRecords: savedCount,
            },
          },
          req: completionTransaction ? { transactionID: completionTransaction } : undefined,
        })

        if (completionTransaction) await payload.db.commitTransaction(completionTransaction)
      } catch (completionError) {
        if (completionTransaction) await payload.db.rollbackTransaction(completionTransaction)
        throw completionError
      }

      console.log(`[Job ${job.id}] Completed. Saved ${savedCount} records.`)

      // 6. Check if all jobs for this task are completed
      const taskId = typeof job.task === 'object' && job.task !== null ? job.task.id : job.task
      if (typeof taskId === 'number' && !isNaN(taskId)) {
        await checkTaskCompletion(payload, taskId)
      } else {
        console.warn(`[Job ${job.id}] Invalid task ID: ${taskId}, skipping task completion check`)
      }

      return { processed: true, message: `Saved ${savedCount} records` }
    } catch (error) {
      console.error(`[Job ${job.id}] Error:`, error)

      // Update job status to ERROR with transaction
      const errorTransaction = await payload.db.beginTransaction()
      try {
        await payload.update({
          collection: 'search-term-asin-jobs',
          id: job.id,
          data: {
            status: 'ERROR',
            message: error instanceof Error ? error.message : String(error),
          },
          req: errorTransaction ? { transactionID: errorTransaction } : undefined,
        })

        if (errorTransaction) await payload.db.commitTransaction(errorTransaction)
      } catch (updateError) {
        if (errorTransaction) await payload.db.rollbackTransaction(errorTransaction)
        console.error(`[Job ${job.id}] Failed to update error status:`, updateError)
      }

      return { processed: false, message: String(error) }
    }
  } catch (e) {
    console.error(`Error claiming job ${job.id}:`, e)
    if (t) await payload.db.rollbackTransaction(t)
    return { processed: false, message: 'Failed to claim job' }
  }
}

async function checkTaskCompletion(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  taskId: number,
) {
  // Check if there are any remaining pending or processing jobs
  const remainingJobs = await payload.count({
    collection: 'search-term-asin-jobs',
    where: {
      and: [{ task: { equals: taskId } }, { status: { in: ['PENDING', 'PROCESSING'] } }],
    },
  })

  if (remainingJobs.totalDocs === 0) {
    // All jobs completed, get total stats
    const completedJobs = await payload.find({
      collection: 'search-term-asin-jobs',
      where: {
        and: [{ task: { equals: taskId } }, { status: { equals: 'COMPLETED' } }],
      },
      limit: 0,
      pagination: false,
    })

    const errorJobs = await payload.count({
      collection: 'search-term-asin-jobs',
      where: {
        and: [{ task: { equals: taskId } }, { status: { equals: 'ERROR' } }],
      },
    })

    let totalSaved = 0
    for (const j of completedJobs.docs) {
      const body = j.body as { savedRecords?: number } | null
      if (body?.savedRecords) {
        totalSaved += body.savedRecords
      }
    }

    const hasErrors = errorJobs.totalDocs > 0
    const status = hasErrors ? 'ERROR' : 'COMPLETED'
    const message = hasErrors
      ? `Completed with ${errorJobs.totalDocs} errors. Total saved: ${totalSaved}`
      : `Successfully processed. Total saved: ${totalSaved}`

    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        status,
        message,
        metadata: JSON.stringify({
          completedJobs: completedJobs.totalDocs,
          errorJobs: errorJobs.totalDocs,
          totalSaved,
          processedAt: new Date().toISOString(),
        }),
      },
    })

    console.log(`[Task ${taskId}] All jobs completed. Status: ${status}`)
  }
}
