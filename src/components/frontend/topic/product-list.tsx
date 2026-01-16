'use client'

import React from 'react'
import { ProductCard, type MergedProduct } from './product-card'
import { Package } from 'lucide-react'

interface ProductListProps {
  products: MergedProduct[]
  currentTopic: string
  excerpt?: string | null
}

export function ProductList({ products, currentTopic, excerpt }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-20 animate-scale-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <span className="text-2xl">📦</span>
        </div>
        <p className="text-lg text-muted-foreground">No related products found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Top {products.length} Products</h2>
      </div>

      {/* Excerpt Description */}
      {excerpt && <p className="text-muted-foreground leading-relaxed -mt-2 mb-4">{excerpt}</p>}

      {/* Product Cards */}
      <div className="space-y-4">
        {products.map((item, index) => (
          <ProductCard key={item.asin} item={item} rank={index + 1} currentTopic={currentTopic} />
        ))}
      </div>
    </div>
  )
}
