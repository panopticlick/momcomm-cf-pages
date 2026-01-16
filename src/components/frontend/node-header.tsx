'use client'

import React from 'react'

interface NodeHeaderProps {
  node: {
    display_name: string
  }
}

export function NodeHeader({ node }: NodeHeaderProps) {
  return (
    <div className="mb-12 space-y-4 animate-slide-up relative bg-card/30 p-8 rounded-3xl border border-white/20 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative z-10">
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight mb-4">
          <span className="bg-clip-text text-transparent bg-linear-to-r from-primary via-blue-600 to-indigo-600">
            {node.display_name}
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl leading-relaxed">
          Explore our curated selection of top-rated{' '}
          <span className="font-medium text-foreground">{node.display_name}</span>. Find detailed
          reviews, comparisons, and expert insights.
        </p>
      </div>
    </div>
  )
}
