'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import type { Data } from 'payload'

export const ApproveTopicCell: React.FC<{
  cellData: { rowData: Data }
}> = ({ cellData: { rowData } }) => {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleApprove = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/topics/${rowData.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requires_review: false,
        }),
      })

      if (response.ok) {
        // Reload the page to show updated state
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to approve topic:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (rowData.requires_review === false) {
    return <span className="text-green-600 dark:text-green-400 text-sm font-medium">Approved</span>
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleApprove}
      disabled={isLoading}
      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
    >
      <Check className="w-4 h-4 mr-1" />
      Approve
    </Button>
  )
}
