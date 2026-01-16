import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

export const maxDuration = 300 // 5 minutes

export async function GET(_req: NextRequest) {
  try {
    const payload = await getPayloadClient()
    let totalProductsCreated = 0
    let totalScrapersCreated = 0

    // Use raw SQL for performance optimization
    const db = payload.db as {
      pool?: {
        connect: () => Promise<{
          query: (sql: string) => Promise<{ rows: { locked?: boolean }[]; rowCount: number }>
          release: () => void
        }>
      }
    }
    if (db.pool) {
      // Use a dedicated client for transaction and locking
      const client = await db.pool.connect()
      try {
        await client.query('BEGIN')

        // Try to acquire an advisory lock with key '1001' (arbitrary unique ID for this job)
        // pg_try_advisory_xact_lock ensures lock is released automatically at the end of transaction
        const { rows } = await client.query('SELECT pg_try_advisory_xact_lock(1001) as locked')
        if (!rows[0].locked) {
          console.log(
            'Skipping product sync: Another instance is already running (Lock 1001 busy).',
          )
          await client.query('ROLLBACK')
          return
        }

        // 1. Sync Products
        // Query to find ASINs in aba_search_terms not in products and insert them
        const productsResult = await client.query(`
            INSERT INTO products (asin, status, active, created_at, updated_at)
            SELECT DISTINCT asin, 'PENDING'::enum_products_status, false, NOW(), NOW()
            FROM aba_search_terms
            WHERE asin NOT IN (SELECT asin FROM products)
            ON CONFLICT (asin) DO NOTHING
          `)
        totalProductsCreated = productsResult.rowCount

        // 2. Sync Product Scrapers
        const scrapersResult = await client.query(`
            INSERT INTO product_scrapers (asin, status, active, created_at, updated_at)
            SELECT DISTINCT asin, 'PENDING'::enum_product_scrapers_status, false, NOW(), NOW()
            FROM aba_search_terms
            WHERE asin NOT IN (SELECT asin FROM product_scrapers)
            ON CONFLICT (asin) DO NOTHING
          `)
        totalScrapersCreated = scrapersResult.rowCount

        // 3. Update sum fields for all products from aba_search_terms aggregation
        const sumResult = await client.query(`
            UPDATE products p
            SET 
              click_share_sum = COALESCE(agg.click_share_sum, 0),
              conversion_share_sum = COALESCE(agg.conversion_share_sum, 0),
              weighted_score_sum = COALESCE(agg.weighted_score_sum, 0),
              updated_at = NOW()
            FROM (
              SELECT 
                asin,
                SUM(COALESCE(click_share, 0)) as click_share_sum,
                SUM(COALESCE(conversion_share, 0)) as conversion_share_sum,
                SUM(COALESCE(weighted_score, 0)) as weighted_score_sum
              FROM aba_search_terms
              GROUP BY asin
            ) agg
            WHERE p.asin = agg.asin
              AND (
                p.click_share_sum IS DISTINCT FROM COALESCE(agg.click_share_sum, 0)
                OR p.conversion_share_sum IS DISTINCT FROM COALESCE(agg.conversion_share_sum, 0)
                OR p.weighted_score_sum IS DISTINCT FROM COALESCE(agg.weighted_score_sum, 0)
              )
          `)
        const totalSumsUpdated = sumResult.rowCount

        console.log(
          `Direct SQL sync executed. Products created: ${totalProductsCreated}, Scrapers created: ${totalScrapersCreated}, Sums updated: ${totalSumsUpdated}`,
        )

        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    } else {
      console.warn(
        'Database pool not accessible. Falling back to inefficient iteration (or failing if loop removed).',
      )
      throw new Error('Raw SQL optimization requires access to payload.db.pool')
    }

    console.log(
      `Sync completed. Created ${totalProductsCreated} products and ${totalScrapersCreated} scrapers.`,
    )
  } catch (error) {
    console.error('Error in product sync cron:', error)
  }

  return NextResponse.json({
    success: true,
    message: 'Product sync initiated',
  })
}
