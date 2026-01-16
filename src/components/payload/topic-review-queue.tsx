'use client'

import React from 'react'
import Link from 'next/link'
import { Eye } from 'lucide-react'

export const TopicReviewQueue: React.FC = () => {
  return (
    <div className="base-stylesheet">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">
              Review Queue
            </h3>
            <p className="text-xs text-muted-foreground">
              Topics requiring review before auto-publish will not be published by the cron job.
            </p>
          </div>
          <Link
            href="/admin/collections/topics?where[requires_review][equals]=true"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Review Queue
          </Link>
        </div>
      </div>
    </div>
  )
}
