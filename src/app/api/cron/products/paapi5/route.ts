import { NextRequest, NextResponse } from 'next/server'
import { syncProductsWithPaapi } from '@/services/products/sync-paapi'
import { withCronLock } from '@/middleware/cron-lock'
import { logger } from '@/lib/logger'
import { config } from '@/lib/config'
import { getPayloadClient } from '@/lib/payload'

// maxDuration must be a static number (Next.js requirement)
// Config value: 300 seconds, hardcoded here for build compatibility
export const maxDuration = 300

export async function GET(req: NextRequest) {
  return withCronLock(req, { lockKey: 'cron:products:paapi5:lock' }, async () => {
    try {
      logger.info('Starting PAAPI5 product sync')

      const result = await syncProductsWithPaapi(await getPayloadClient(), config.api.defaultLimit)

      logger.info('PAAPI5 product sync completed', { result })

      return NextResponse.json({
        success: true,
        message: 'Product sync completed',
        result,
      })
    } catch (error) {
      logger.error('PAAPI5 product sync failed', error as Error)

      return NextResponse.json(
        {
          success: false,
          message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
        { status: 500 },
      )
    }
  })
}
