'use client'

import React from 'react'
import { StatusSummary } from './status-summary'

export const PostStatusSummary: React.FC = () => {
  return <StatusSummary apiEndpoint="/api/posts/summary" label="Total Posts" />
}
