import { PayloadHandler } from 'payload'
import { getPayloadClient } from '@/lib/payload'
import { applyDuplicateRedirects, DuplicateTopicItem } from '@/services/topics/dedupe-topics'

export const dedupeApplyHandler: PayloadHandler = async (req) => {
  try {
    const body = req.json ? await req.json() : {}
    const { duplicateGroups } = body as { duplicateGroups: DuplicateTopicItem[][] }

    if (!duplicateGroups || !Array.isArray(duplicateGroups)) {
      return Response.json(
        {
          success: false,
          message: 'Invalid request: duplicateGroups is required',
        },
        { status: 400 },
      )
    }

    if (duplicateGroups.length === 0) {
      return Response.json({
        success: true,
        message: 'No duplicate groups to process',
        redirectsApplied: 0,
      })
    }

    const payload = await getPayloadClient()

    // Apply redirects using existing service function
    const result = await applyDuplicateRedirects(payload, duplicateGroups)

    return Response.json({
      success: true,
      message: 'Deduplication applied successfully',
      redirectsApplied: result.totalUpdated,
      groupsProcessed: duplicateGroups.length,
    })
  } catch (error) {
    console.error('Dedupe apply error:', error)

    return Response.json(
      {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
