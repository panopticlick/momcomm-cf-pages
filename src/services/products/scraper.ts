import { BasePayload } from 'payload'
import { AmzScraperClient } from '@/services/amz-scraper-client'

export type ScraperResult = {
  processed: number
  success: number
  errors: number
  message?: string
}

export async function processScraperTasks(
  payload: BasePayload,
  limit: number = 2,
): Promise<ScraperResult> {
  const scraper = new AmzScraperClient()

  // Find active items with PENDING status
  const { docs: items } = await payload.find({
    collection: 'product-scrapers',
    where: {
      and: [
        {
          status: {
            equals: 'PENDING',
          },
        },
      ],
    },
    limit,
    sort: 'createdAt',
  })

  if (items.length === 0) {
    console.log('No pending product scrapers found.')
    return {
      processed: 0,
      success: 0,
      errors: 0,
      message: 'No pending product scrapers found',
    }
  }

  console.log(`Processing ${items.length} product scrapers...`)

  let successCount = 0
  let errorCount = 0

  // Process concurrently
  await Promise.all(
    items.map(async (item) => {
      try {
        // Update status to PROCESSING
        await payload.update({
          collection: 'product-scrapers',
          id: item.id,
          data: {
            status: 'PROCESSING',
          },
        })

        // Fetch data
        const { data } = await scraper.getAsin(item.asin)

        // Update with success
        await payload.update({
          collection: 'product-scrapers',
          id: item.id,
          data: {
            status: 'COMPLETED',
            active: true,
            scraperMetadata: data as never,
            completed_at: new Date().toISOString(),
          },
        })

        console.log(`Successfully scraped product: ${item.asin}`)
        successCount++
      } catch (error) {
        console.error(`Error scraping product ${item.asin}:`, error)

        const errorMessage = error instanceof Error ? error.message : String(error)
        const isNotFound = errorMessage.includes('[404]')

        await payload.update({
          collection: 'product-scrapers',
          id: item.id,
          data: {
            status: isNotFound ? 'NOT_FOUND' : 'ERROR',
            active: isNotFound ? false : item.active,
            message: isNotFound ? 'Product not found' : errorMessage,
          },
        })
        errorCount++
      }
    }),
  )

  return {
    processed: items.length,
    success: successCount,
    errors: errorCount,
    message: 'Scraping batch completed',
  }
}
