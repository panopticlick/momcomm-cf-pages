'use client'

import React from 'react'
import { StatusSummary } from './status-summary'

export const SearchTermAsinJobStatusSummary: React.FC = () => {
  return <StatusSummary apiEndpoint="/api/search-term-asin-jobs/summary" label="Total Jobs" />
}
