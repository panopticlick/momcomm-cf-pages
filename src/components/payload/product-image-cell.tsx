'use client'

import React from 'react'

interface ProductImageCellProps {
  cellData?: string
}

export const ProductImageCell: React.FC<ProductImageCellProps> = ({ cellData }) => {
  if (!cellData) {
    return <span>-</span>
  }

  return (
    <img
      src={cellData}
      alt="Product"
      style={{
        width: '40px',
        height: '40px',
        objectFit: 'contain',
        borderRadius: '4px',
        backgroundColor: 'var(--theme-elevation-50)',
      }}
    />
  )
}
