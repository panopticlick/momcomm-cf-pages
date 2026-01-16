'use client'

import React, { useEffect, useState } from 'react'

type StatusCounts = {
  PENDING: number
  PROCESSING: number
  COMPLETED: number
  ERROR: number
  NOT_FOUND: number
}

const statusColors = {
  PENDING: { bg: '#e0e0e0', text: '#616161', border: '#bdbdbd' },
  PROCESSING: { bg: '#e3f2fd', text: '#1976d2', border: '#90caf9' },
  COMPLETED: { bg: '#e8f5e9', text: '#388e3c', border: '#a5d6a7' },
  ERROR: { bg: '#ffebee', text: '#d32f2f', border: '#ef9a9a' },
  NOT_FOUND: { bg: '#eceff1', text: '#546e7a', border: '#cfd8dc' },
}

export const ProductStatusSummary: React.FC = () => {
  const [stats, setStats] = useState<StatusCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/products/summary')
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
  }, [])

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

  const total = Object.values(stats).reduce((a, b) => a + b, 0)

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
          Total Products
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

      {(Object.keys(statusColors) as Array<keyof StatusCounts>).map((status) => {
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
