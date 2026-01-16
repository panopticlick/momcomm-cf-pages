'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface OverviewItem {
  Label: string
  DisplayValue: string
}

interface ProductOverviewProps {
  overview: OverviewItem[]
}

export function ProductOverview({ overview }: ProductOverviewProps) {
  if (overview.length === 0) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-bold text-lg mb-4">Product Information</h3>
        <div className="grid grid-cols-1 gap-3">
          {overview.map((item: OverviewItem, i: number) => (
            <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
              <span className="font-medium text-sm text-muted-foreground">{item.Label}</span>
              <span className="text-sm text-foreground font-medium">{item.DisplayValue}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
