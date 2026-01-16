import { processPendingJobs } from '@/services/job-processor'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300

export async function GET(_req: NextRequest) {
  const result = await processPendingJobs()

  return NextResponse.json({
    success: true,
    ...result,
  })
}
