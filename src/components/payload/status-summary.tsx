'use client'

import React, { useEffect, useState } from 'react'

type StatusCounts = Record<string, number>

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: '#e0e0e0', text: '#616161', border: '#bdbdbd' },
  PROCESSING: { bg: '#e3f2fd', text: '#1976d2', border: '#90caf9' },
  COMPLETED: { bg: '#e8f5e9', text: '#388e3c', border: '#a5d6a7' },
  ERROR: { bg: '#ffebee', text: '#d32f2f', border: '#ef9a9a' },
  NOT_FOUND: { bg: '#eceff1', text: '#546e7a', border: '#cfd8dc' },
  QUEUED: { bg: '#f3e5f5', text: '#7b1fa2', border: '#ce93d8' },
  METADATA_PROCESSING: { bg: '#e3f2fd', text: '#1976d2', border: '#90caf9' },
  METADATA_COMPLETED: { bg: '#e8f5e9', text: '#388e3c', border: '#a5d6a7' },
  METADATA_ERROR: { bg: '#ffebee', text: '#d32f2f', border: '#ef9a9a' },
  CONTENT_PROCESSING: { bg: '#fff3e0', text: '#ef6c00', border: '#ffcc80' },
  CONTENT_COMPLETED: { bg: '#e8f5e9', text: '#388e3c', border: '#a5d6a7' },
  CONTENT_ERROR: { bg: '#ffebee', text: '#d32f2f', border: '#ef9a9a' },
  // Post statuses
  pending: { bg: '#e0e0e0', text: '#616161', border: '#bdbdbd' },
  processing_content: { bg: '#fff3e0', text: '#ef6c00', border: '#ffcc80' },
  processing_media: { bg: '#e3f2fd', text: '#1976d2', border: '#90caf9' },
  content_completed: { bg: '#f1f8e9', text: '#33691e', border: '#aed581' },
  media_completed: { bg: '#e1f5fe', text: '#01579b', border: '#4fc3f7' },
  completed: { bg: '#e8f5e9', text: '#388e3c', border: '#a5d6a7' },
}

interface StatusSummaryProps {
  apiEndpoint: string
  label?: string
}

export const StatusSummary: React.FC<StatusSummaryProps> = ({
  apiEndpoint,
  label = 'Total Jobs',
}) => {
  const [stats, setStats] = useState<StatusCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const res = await fetch(apiEndpoint)
      if (!res.ok) throw new Error('Failed to fetch status summary')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [apiEndpoint])

  if (loading) {
    return (
      <div
        style={{
          padding: '16px',
          marginBottom: '20px',
          background: 'var(--theme-elevation-50)',
          borderRadius: '4px',
          color: 'var(--theme-elevation-400)',
          fontSize: '14px',
        }}
      >
        Loading status summary...
      </div>
    )
  }

  if (error) return null

  if (!stats) return null

  const total = Object.values(stats).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--theme-elevation-50)',
          borderRadius: '6px',
          border: '1px solid var(--theme-elevation-100)',
          display: 'flex',
          flexDirection: 'column',
          minWidth: '100px',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--theme-elevation-400)',
            marginBottom: '4px',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: '24px',
            fontWeight: '600',
            color: 'var(--theme-text)',
          }}
        >
          {total}
        </span>
      </div>

      {(Object.keys(stats) as Array<keyof StatusCounts>).map((status) => {
        if (!statusColors[status]) return null
        const count = stats[status] || 0
        const style = statusColors[status]
        return (
          <div
            key={status}
            style={{
              padding: '12px 16px',
              background: 'var(--theme-elevation-50)',
              borderRadius: '6px',
              border: `1px solid ${style.border}`,
              display: 'flex',
              flexDirection: 'column',
              minWidth: '100px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                backgroundColor: style.text,
              }}
            />

            <span
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--theme-elevation-400)',
                marginBottom: '4px',
                paddingLeft: '8px',
              }}
            >
              {status.replace('_', ' ')}
            </span>
            <span
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: 'var(--theme-text)',
                paddingLeft: '8px',
              }}
            >
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}
