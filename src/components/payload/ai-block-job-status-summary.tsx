'use client'

import React from 'react'
import { StatusSummary } from './status-summary'

export const AiBlockJobStatusSummary: React.FC = () => {
  return <StatusSummary apiEndpoint="/api/ai-block-jobs/summary" label="Total Jobs" />
}
