import { processPendingTask } from '@/services/task-processor'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300 // Increase duration to 5 minutes to handle pagination

export async function GET(_req: NextRequest) {
  // Schedule background processing
  await processPendingTask()
  // Return immediately
  return NextResponse.json({
    success: true,
    message: 'Task processing initiated in background',
  })
}
