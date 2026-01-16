import { NextRequest, NextResponse } from 'next/server'
import { updateTopicsStats } from '@/services/topics/update-stats'
import { withCronLock } from '@/middleware/cron-lock'

export const maxDuration = 300 // 5 minutes

export async function GET(req: NextRequest) {
  return withCronLock(req, { lockKey: 'cron:topics:update:lock' }, async () => {
    try {
      const result = await updateTopicsStats()

      return NextResponse.json({
        success: true,
        message: 'Topics stats update completed',
        result,
      })
    } catch (error) {
      console.error('Job failed:', error)

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
