'use client'

import React from 'react'

interface TopicNameCellProps {
  rowData: {
    name?: string
    slug?: string
  }
}

export const TopicNameCell: React.FC<TopicNameCellProps> = ({ rowData }) => {
  const { name, slug } = rowData

  if (!slug) {
    return <span>{name || '-'}</span>
  }

  const frontendUrl = `/gear/${slug}`

  return (
    <a
      href={frontendUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: 'var(--theme-elevation-500)',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = 'underline'
        e.currentTarget.style.color = 'var(--theme-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = 'none'
        e.currentTarget.style.color = 'var(--theme-elevation-500)'
      }}
    >
      {name || '-'}
    </a>
  )
}
