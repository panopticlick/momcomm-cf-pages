'use client'

import React from 'react'
import { StatusSummary } from './status-summary'

export const TopicStatusSummary: React.FC = () => {
  return <StatusSummary apiEndpoint="/api/topics/summary" label="Total Topics" />
}
